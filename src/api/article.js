import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/article',
    method: 'get',
    params: query
  })
}

export function fetchArticle(id) {
  return request({
    url: '/article/' + id,
    method: 'get'
  })
}

export function deleteArticle(id) {
  return request({
    url: '/article/' + id,
    method: 'delete'
  })
}

export function fetchInfo() {
  return request({
    url: '/info',
    method: 'get'
  })
}

export function updateArticle(data) {
  return request({
    url: '/article',
    method: 'put',
    data
  })
}

export function updateArticlePublish(id) {
  return request({
    url: '/article/publish/' + id,
    method: 'put'
  })
}

export function updateArticleUnPublish(id) {
  return request({
    url: '/article/unpublish/' + id,
    method: 'put'
  })
}

export function createArticle(data) {
  return request({
    url: '/article',
    method: 'post',
    data
  })
}
