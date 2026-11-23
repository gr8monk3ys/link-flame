# Digital downloads are stored in the database, not in the repository

The repository is public and `/public` is served without checks, so files sold as digital Products are stored as `DigitalAsset` rows (`data Bytes`, with `sha256` and `sizeBytes`) and served only through token links with a download limit (`lib/digital-downloads.ts`). Paid files therefore never sit in `/public` or in git history, at the cost of database size and of streaming the bytes through a route handler instead of a CDN.
