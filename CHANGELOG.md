# Changelog

All notable changes to this repository are documented here.

## 4.3.2

- Made the userscript metadata block begin at the first byte for userscript-manager compatibility.
- Replaced the unapproved GitHub SHA-256 dependency with the browser's built-in Web Crypto API.
- Added validation that prevents either Greasy Fork publishing issue from returning.

## 4.3.1

- Added a literal **Create directory** button to each post's download options.
- Fixed Chrome directory-picker failures caused by invalid IDs longer than 32 characters.
- Added visible folder-ready and retryable error states instead of silently disabling the picker.

## 4.3.0

- Renamed the userscript and installable file to `$IMPC!TYDOWNLOADER`.
- Reused the performer directory when the user selects that directory directly.
- Added automatic performer-directory creation when a parent such as Downloads is selected.
- Persisted performer directory handles across thread pages.
- Added a full-width aggregate download progress bar fixed to the bottom of the screen.

## 4.2.0

- Added real performer-directory creation through Chromium's File System Access API.
- Added a portable performer-rooted ZIP fallback for other browsers.
- Added page-level **Download all images** and **Download all videos** actions.
- Added resolved-URL media classification for mixed sources.
- Added conflict-safe filenames for files written through directory handles.
- Added browser coverage for native-directory and portable archive modes.

## 4.1.0

- Added the persistent **Performer folder** setting.
- Added performer-name parsing that removes XenForo prefix labels.
- Added performer-rooted archive paths and download names.
- Improved post-number parsing.

## 4.0.0

- Refreshed the post controls, settings card, progress UI, and page-download drawer.
- Added startup resilience for late userscript injection and malformed promoted posts.
- Expanded resolver and direct-download handling for supported media hosts.
