// Note: `export {}` tells TypeScript this file is an ES module (not a script).
// Without it, top-level variables would be treated as global, causing conflicts
// with other files. This is only needed when the file has no other import/export.
export {};
// ============================================
// NODE.JS HTTP SERVER Exercise
// ============================================
// Run this file with: npx ts-node src/04-backend/lessons/01-nodejs-and-npm/exercises/server.ts
//
// This exercise goes beyond the basic example — you'll build a mini notes API
// with in-memory storage, POST body parsing, and URL query parameters.
// These are real skills you'll need for every backend you build.

import * as http from 'node:http';

const PORT = 3000;

// In-memory storage for notes
interface Note {
  id: number;
  text: string;
  createdAt: string;
}

const notes: Note[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
let nextId = 1; // eslint-disable-line @typescript-eslint/no-unused-vars, prefer-const

// TODO: Implement a helper that reads the request body and parses it as JSON.
//
// The `http` module gives you the body as a stream of chunks, not a single string.
// You need to collect all chunks, concatenate them, and then JSON.parse().
//
// function parseBody(req: http.IncomingMessage): Promise<any> {
//   return new Promise((resolve, reject) => {
//     const chunks: Buffer[] = [];
//     req.on('data', (chunk) => ... );       // collect each chunk
//     req.on('end', () => ... );             // concatenate and parse
//     req.on('error', (err) => reject(err));
//   });
// }

// TODO: Implement a helper that parses a URL and extracts the pathname and query params.
//
// Use the built-in URL class:
//   const parsed = new URL(rawUrl, 'http://localhost');
//   parsed.pathname  → '/notes'
//   parsed.searchParams.get('search')  → 'hello' (from '/notes?search=hello')
//
// function parseUrl(rawUrl: string): { pathname: string; searchParams: URLSearchParams } { ... }

// TODO: Create an HTTP server with http.createServer() that handles:
//
// 1. GET /health
//    - Status 200
//    - Body: { status: "ok", timestamp: <ISO string> }
//
// 2. GET /notes
//    - Status 200
//    - Body: array of all notes
//    - BONUS: support ?search=<text> query param — filter notes whose `text`
//      includes the search string (case-insensitive)
//
// 3. POST /notes
//    - Read the JSON body using your parseBody helper
//    - Body must contain { text: string }
//    - If `text` is missing or empty, respond 400: { error: "text is required" }
//    - Otherwise create a new Note (assign id, set createdAt), push to array
//    - Status 201
//    - Body: the created note object
//
// 4. DELETE /notes/:id
//    - Extract the id from the URL (e.g., /notes/3 → id = 3)
//    - Find and remove the note with that id
//    - If not found, respond 404: { error: "Note not found" }
//    - If found, respond 200: { deleted: true }
//
// 5. Any other route → 404: { error: "Not Found" }
//
// Requirements:
// - Always set Content-Type to application/json
// - Log each request to console: "<METHOD> <URL>"
// - Listen on PORT (3000)
//
// Test with:
//   curl http://localhost:3000/health
//   curl http://localhost:3000/notes
//   curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"Buy milk"}'
//   curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"Learn Node.js"}'
//   curl http://localhost:3000/notes?search=milk
//   curl -X DELETE http://localhost:3000/notes/1
//   curl http://localhost:3000/notes

// Your code here:
