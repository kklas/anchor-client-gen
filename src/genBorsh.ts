import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import { Project } from "ts-morph"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function genBorsh(project: Project, outPath: (path: string) => string) {
  // Resolve borsh.ts relative to this compiled file's directory.
  // After build, borsh.ts is copied to dist/ alongside the compiled output.
  const borshSrc = fs.readFileSync(path.resolve(__dirname, "borsh.ts"), "utf-8")

  project.createSourceFile(outPath("utils/borsh.ts"), borshSrc, {
    overwrite: true,
  })
}
