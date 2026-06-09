export function saveAs(data: Blob, filename: string = 'file') {
  const dataURI = URL.createObjectURL(data)

  try {
    const link = document.createElement('a')
    link.href = dataURI
    link.download = filename
    link.click()
  } finally {
    URL.revokeObjectURL(dataURI)
  }
}
