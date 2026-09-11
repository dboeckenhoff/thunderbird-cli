/**
 * Outbound-attachment loading for the MCP server (`email_compose` attachments).
 *
 * This is a self-contained copy of cli/src/attachments.js, so that the mcp
 * package has no runtime dependency on the cli package (same pattern as
 * mcp/src/client.js). Keep in sync with cli/src/attachments.js.
 */

import { existsSync, statSync, readFileSync } from "fs";
import { basename } from "path";

/**
 * Cap on one attachment, in bytes. Above this, the base64 payload through the
 * WebSocket bridge gets large and slow, and a share link is the better route
 * (the atool wrapper offers exactly that via --attach-link).
 */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20 MiB

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".html": "text/html",
  ".htm": "text/html",
  ".json": "application/json",
  ".xml": "application/xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".tar": "application/x-tar",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".eml": "message/rfc822",
  ".ics": "text/calendar",
  ".vcard": "text/vcard",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** Guess a Content-Type from the file extension; octet-stream when unknown. */
export function contentTypeFor(path) {
  const dot = path.lastIndexOf(".");
  if (dot < 0) return "application/octet-stream";
  return MIME_BY_EXT[path.slice(dot).toLowerCase()] || "application/octet-stream";
}

/**
 * Read a file for attachment. Returns `{ name, contentType, data }` with
 * `data` base64 — the wire format the bridge/extension expect.
 *
 * Throws a loud Error naming the path when it is missing, not a regular
 * file, or over MAX_ATTACHMENT_BYTES.
 */
export function readAttachment(path) {
  if (!existsSync(path)) throw new Error(`--attach: no such file: ${path}`);
  const stat = statSync(path);
  if (!stat.isFile()) throw new Error(`--attach: not a regular file: ${path}`);
  if (stat.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `--attach: ${path} is ${stat.size} bytes, over the ${MAX_ATTACHMENT_BYTES}-byte (20 MiB) limit — share a link to the file instead of attaching it`
    );
  }
  return {
    name: basename(path),
    contentType: contentTypeFor(path),
    data: readFileSync(path).toString("base64"),
  };
}
