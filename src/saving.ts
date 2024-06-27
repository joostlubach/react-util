export function saveAs(data: Blob | string, filename: string) {
  const dataURI = data instanceof Blob ? URL.createObjectURL(data) : data

  try {
    const link = document.createElement('a')
    link.href = dataURI
    link.download = filename
    link.click()
  } finally {
    if (data instanceof Blob) {
      URL.revokeObjectURL(dataURI)
    }
  }
}
