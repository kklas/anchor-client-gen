import * as fs from "fs"
import * as path from "path"
import { Project } from "ts-morph"

export function genBorsh(project: Project, outPath: (path: string) => string) {
  // Resolve borsh.ts relative to the running script's directory.
  // After build, borsh.ts is copied to dist/ alongside main.js.
  const scriptDir = path.dirname(path.resolve(process.argv[1]))
  const borshSrc = fs.readFileSync(path.resolve(scriptDir, "borsh.ts"), "utf-8")

  project.createSourceFile(outPath("utils/borsh.ts"), borshSrc, {
    overwrite: true,
  })
}
