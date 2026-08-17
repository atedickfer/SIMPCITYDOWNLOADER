# $IMPC!TYDOWNLOADER usage examples

These examples assume $IMPC!TYDOWNLOADER is installed and a supported thread is open.

## 1. Download every file from one post

1. Find the **Download (x/x)** control in the post header.
2. Click it to use your saved settings.
3. The progress card reports resolution and download progress.

Open the gear menu first when you want to change sources or output behavior.

## 2. Download only selected sources

1. Open the post's gear menu.
2. Leave only the desired source chips enabled—for example, XenForo attachments and Bunkr.
3. Click **Download files**.

The button count updates as source chips are enabled or disabled.

## 3. Put downloads in a performer folder

1. Enable **Performer folder**.
2. Start the download.
3. On Chrome or Edge, choose the parent destination when prompted. Choose `Downloads` to produce `Downloads/Performer Name/`.

When direct directory writing is unavailable, the script produces this portable archive layout:

```text
Performer Name #12.zip
└── Performer Name/
    ├── image-01.jpg
    ├── image-02.jpg
    └── clip-01.mp4
```

Prefix badges such as `OnlyFans`, `Fansly`, or other XenForo labels are removed from the performer directory name.

## 4. Download every image on the page

Click **Download all images** in the thread header or page drawer.

The script:

1. Selects known image hosts.
2. Resolves ambiguous hosts such as attachments and albums.
3. Classifies resolved filenames.
4. Excludes files classified as video.
5. Applies your ZIP and performer-folder settings to each post.

## 5. Download every video on the page

Click **Download all videos**. The same media filtering runs in the opposite direction and excludes files classified as images.

Some extensionless or unusual host URLs cannot be classified until after resolution. Unsupported formats may be omitted from the media-specific actions; use **Download page** when you need every resolvable file regardless of type.

## 6. Download selected posts

1. Click **Download page**.
2. Check individual posts or use **Select all**.
3. Click **Download selected**.

The drawer shows the selected post count and total source-file count before downloading.

## 7. Generate a link list without media

1. Open the gear menu.
2. Enable **Skip download**.
3. Leave **Generate links** enabled.
4. Start the post download.

The generated archive contains `links.txt` with resolved URLs. Enable **Generate log** when troubleshooting a resolver.

## 8. Flatten album folders

Enable **Flatten** to remove host album directories from the output. Duplicate filenames receive numeric suffixes instead of overwriting one another.

Example:

```text
photo.jpg
photo (2).jpg
photo (3).jpg
```

## 9. Remove duplicate files

Enable **Skip duplicates** to discard resolved items that produce the same filename. This is useful when a post embeds and links the same media more than once.

## 10. Customize archive names

Where the filename field is available, these tokens are supported:

| Token | Replacement |
| --- | --- |
| `:title:` | Current thread title |
| `:#:` | XenForo post number |
| `:id:` | XenForo post ID |

Example:

```text
:title: - post :#:.zip
```
