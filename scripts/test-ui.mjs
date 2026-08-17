import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const fixtureUrl = pathToFileURL(resolve('tests/xfpd-fixture.html')).href;
const browser = await chromium.launch({ headless: true });

const openFixture = async query => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${fixtureUrl}${query}`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.dataset.xfpdInitialized === 'true');
    await page.locator('[id^="xfpd-create-directory-"]').waitFor();
    return { context, page, errors };
};

try {
    {
        const { context, page, errors } = await openFixture('');
        const sha256 = await page.evaluate(() => globalThis.eval('xfpdSha256("abc")'));
        assert.equal(sha256, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

        const button = page.locator('[id^="xfpd-create-directory-"]');
        await button.click();
        await page.waitForFunction(() => document.querySelector('[id^="xfpd-directory-status-"]')?.classList.contains('is-ready'));

        const state = await page.evaluate(() => ({
            checked: document.querySelector('[id*="-performer-folder"]')?.checked,
            buttonText: document.querySelector('[id^="xfpd-create-directory-"]')?.textContent.trim(),
            status: document.querySelector('[id^="xfpd-directory-status-"]')?.textContent.trim(),
            pickerCalls: window.__pickerCalls,
            pickerOptions: window.__pickerOptions,
            directories: [...window.__fixtureDownloadRoot.directories.keys()],
        }));

        assert.equal(state.checked, true, 'Create directory should enable Performer folder');
        assert.equal(state.buttonText, 'Change directory');
        assert.equal(state.status, 'Ready: Fixture Performer');
        assert.equal(state.pickerCalls, 1);
        assert.deepEqual(state.directories, ['Fixture Performer']);
        assert.match(state.pickerOptions[0].id, /^[A-Za-z0-9_-]{1,32}$/);
        assert.equal(state.pickerOptions[0].mode, 'readwrite');

        await page.locator('.xfpd-dl').click();
        await page.waitForFunction(() => window.__nativeWrites.length > 0);
        const downloadState = await page.evaluate(() => ({
            pickerCalls: window.__pickerCalls,
            paths: window.__nativeWrites.map(write => write.path),
        }));
        assert.equal(downloadState.pickerCalls, 1, 'Download should reuse the created directory');
        assert.ok(downloadState.paths.every(path => path.startsWith('Fixture Performer/')));
        assert.deepEqual(errors, []);
        await context.close();
    }

    {
        const { context, page, errors } = await openFixture('?picker-error=1');
        const button = page.locator('[id^="xfpd-create-directory-"]');
        await button.click();
        await page.waitForFunction(() => document.querySelector('[id^="xfpd-directory-status-"]')?.classList.contains('is-error'));

        const failed = await page.evaluate(() => ({
            pickerCalls: window.__pickerCalls,
            status: document.querySelector('[id^="xfpd-directory-status-"]')?.textContent.trim(),
        }));
        assert.equal(failed.pickerCalls, 1);
        assert.match(failed.status, /Could not create the folder/);

        await button.click();
        await page.waitForFunction(() => document.querySelector('[id^="xfpd-directory-status-"]')?.classList.contains('is-ready'));
        const retried = await page.evaluate(() => ({
            pickerCalls: window.__pickerCalls,
            status: document.querySelector('[id^="xfpd-directory-status-"]')?.textContent.trim(),
        }));
        assert.equal(retried.pickerCalls, 2, 'A picker error must not disable retries');
        assert.equal(retried.status, 'Ready: Fixture Performer');
        assert.deepEqual(errors, []);
        await context.close();
    }

    {
        const { context, page, errors } = await openFixture('?select-performer=1');
        await page.locator('[id^="xfpd-create-directory-"]').click();
        await page.waitForFunction(() => document.querySelector('[id^="xfpd-directory-status-"]')?.classList.contains('is-ready'));
        const direct = await page.evaluate(() => ({
            nestedDirectories: window.__fixturePerformerRoot.directories.size,
            status: document.querySelector('[id^="xfpd-directory-status-"]')?.textContent.trim(),
        }));
        assert.equal(direct.nestedDirectories, 0, 'Selecting the performer itself must not create a nested folder');
        assert.equal(direct.status, 'Ready: Fixture Performer');
        assert.deepEqual(errors, []);
        await context.close();
    }

    for (const mode of [
        { id: 'xfpd-thread-images', label: 'photos', expectedImages: 3, expectedVideos: 0 },
        { id: 'xfpd-thread-videos', label: 'videos', expectedImages: 0, expectedVideos: 3 },
        { id: 'xfpd-thread-both', label: 'photos and videos', expectedImages: 3, expectedVideos: 3 },
    ]) {
        const { context, page, errors } = await openFixture('');
        await page.locator('#download-thread').click();
        await page.locator(`#${mode.id}`).click();
        await page.waitForFunction(() => document.querySelector('#xfpd-thread-progress .xfpd-progress-status')?.textContent.startsWith('Complete:'), null, { timeout: 30_000 });

        const threadState = await page.evaluate(() => ({
            fetchedPages: window.__threadPageFetches,
            pickerCalls: window.__pickerCalls,
            zipEntries: window.__zipEntries,
            nativePaths: window.__nativeWrites.map(write => write.path),
            status: document.querySelector('#xfpd-thread-progress .xfpd-progress-status')?.textContent.trim(),
            pageBadge: document.querySelector('#xfpd-thread-pages')?.textContent.trim(),
            buttonsEnabled: [...document.querySelectorAll('.xfpd-thread-actions button')].every(button => !button.disabled),
        }));

        const imageEntries = threadState.zipEntries.filter(path => /\.jpe?g$/i.test(path));
        const videoEntries = threadState.zipEntries.filter(path => /\.mp4$/i.test(path));
        assert.deepEqual(threadState.fetchedPages, [2, 3]);
        assert.equal(threadState.pickerCalls, 1, `${mode.label}: performer directory picker should open once`);
        assert.equal(new Set(imageEntries).size, mode.expectedImages, `${mode.label} image count`);
        assert.equal(new Set(videoEntries).size, mode.expectedVideos, `${mode.label} video count`);
        assert.match(threadState.status, new RegExp(`Complete: ${mode.expectedImages + mode.expectedVideos} of ${mode.expectedImages + mode.expectedVideos} ${mode.label}`));
        assert.equal(threadState.pageBadge, '3 pages');
        assert.equal(threadState.buttonsEnabled, true);
        assert.ok(threadState.nativePaths.every(path => path.startsWith('Fixture Performer/')));
        assert.deepEqual(errors, []);
        await context.close();
    }

    console.log('Browser UI flow verified.');
} finally {
    await browser.close();
}
