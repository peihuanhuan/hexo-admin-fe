import request from '@/utils/request'

export function upload(formData) {
  return request({
    url: '/upload',
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  })
}

export function policy(title) {
  return request({
    url: '/upload/policy',
    method: 'get',
    params: { title }
  })
}
