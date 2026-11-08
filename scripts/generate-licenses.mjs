import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const pkgPath = resolve(process.cwd(), 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const prodDeps = Object.keys(pkg.dependencies || {})

let content = `# Lisensi Pihak Ketiga (Third-Party Licenses)

Dokumen ini memuat informasi lisensi dari dependensi produksi yang digunakan oleh TokFlow.

---

`

for (const dep of prodDeps) {
  const depPkgPath = resolve(process.cwd(), 'node_modules', dep, 'package.json')
  if (existsSync(depPkgPath)) {
    const depPkg = JSON.parse(readFileSync(depPkgPath, 'utf8'))
    const license =
      depPkg.license || (depPkg.licenses ? JSON.stringify(depPkg.licenses) : 'Unknown')
    const author = typeof depPkg.author === 'object' ? depPkg.author.name : depPkg.author || 'N/A'

    // Check for LICENSE file
    let licenseText = ''
    const possibleLicenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md']
    for (const licFile of possibleLicenseFiles) {
      const fullPath = join(process.cwd(), 'node_modules', dep, licFile)
      if (existsSync(fullPath)) {
        licenseText = readFileSync(fullPath, 'utf8')
        break
      }
    }

    content += `## ${dep} (v${depPkg.version})

- **Lisensi:** ${license}
- **Pembuat / Author:** ${author}
- **Repositori:** ${depPkg.repository ? depPkg.repository.url || depPkg.repository : 'N/A'}

\`\`\`
${licenseText.trim() || 'Lihat direktori paket untuk teks lisensi lengkap.'}
\`\`\`

---

`
  } else {
    content += `## ${dep}

- **Lisensi:** Belum terpasang di node_modules.

---

`
  }
}

writeFileSync(resolve(process.cwd(), 'THIRD_PARTY_LICENSES.md'), content, 'utf8')
console.log('THIRD_PARTY_LICENSES.md berhasil diperbarui.')
