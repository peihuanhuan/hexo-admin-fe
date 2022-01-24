import request from '@/utils/request'
import store from '@/store'
import { getToken } from '@/utils/auth'

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

// 初次加载必须同步执行！
export function fetchArticleAsync(id) {
  var xhr = new XMLHttpRequest()
  xhr.open('get', process.env.VUE_APP_BASE_API + '/article/' + id, false) // 同步请求
  if (store.getters.token) {
    // let each request carry token
    // ['X-Token'] is a custom headers key
    // please modify it according to the actual situation
    xhr.setRequestHeader('X-Token', getToken())
  }
  xhr.send()
  return xhr
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

export function cancelPublish(id) {
  return request({
    url: '/article/cancelPublish/' + id,
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

export function addUpdateAndPublish(data) {
  return request({
    url: '/article/addUpdateAndPublish',
    method: 'post',
    data
  })
}
