import { exec } from 'child_process'
import fs from 'fs'

exec('npx nuxi typecheck', (err, stdout, stderr) => {
  fs.writeFileSync('out.txt', stdout + stderr)
})
