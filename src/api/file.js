import request from '@/utils/request'

export function upload(formData) {
  return request({
    url: '/upload',
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  })
}
