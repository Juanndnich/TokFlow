import { lookup } from 'dns'

export function dnsLookupCheck(host = 'tiktok.com'): Promise<boolean> {
  return new Promise((resolve) => {
    lookup(host, (err, address) => {
      if (!err && address) {
        resolve(true)
      } else {
        // Coba alternatif kedua jika tiktok.com bermasalah
        lookup('1.1.1.1', (err2, addr2) => {
          resolve(!err2 && !!addr2)
        })
      }
    })
  })
}
