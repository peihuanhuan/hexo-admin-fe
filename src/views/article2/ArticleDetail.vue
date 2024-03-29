<template>
  <div class="createPost-container">
    <el-form
      ref="postForm"
      :model="postForm"
      :rules="rules"
      class="form-container"
    >
      <sticky
        :z-index="10"
        :class-name="
          'sub-navbar ' + (postForm.publish === true ? 'published' : 'draft')
        "
      >
        <el-button
          :loading="loading"
          style="margin-left: 10px"
          type="success"
          @click="addUpdateAndPublish"
        >
          发布文章
        </el-button>
        <el-button
          :loading="draftLoading"
          type="warning"
          @click="updateArticle(false)"
        >
          保存草稿 <i class="el-icon-coffee-cup" />
        </el-button>
        <el-button
          v-if="postForm.id !== undefined"
          :loading="loading"
          type="info"
          @click="cancelPublish"
        >
          取消发布
        </el-button>
      </sticky>

      <div class="createPost-main-container">
        <el-row>
          <el-col :span="24">
            <!-- <el-form-item style="margin-bottom: 40px" prop="title" >
              <MDinput
                v-model="postForm.title"
                :maxlength="100"
                name="name"
                required
              >
                Title
              </MDinput>
            </el-form-item> -->

            <div class="postInfo-container">
              <el-row>
                <el-col :span="10">
                  <el-form-item
                    label-width="45px"
                    label="分类:"
                    class="postInfo-container-item"
                  >
                    <el-select
                      v-model="postForm.categories"
                      style="width: 320px"
                      placeholder="请选择文章分类"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                    >
                      <el-option
                        v-for="item in categoryOptions"
                        :key="item"
                        :value="item"
                        :label="item"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item
                    label-width="80px"
                    label="标签:"
                    class="postInfo-container-item"
                  >
                    <el-select
                      v-model="postForm.tags"
                      style="width: 320px"
                      placeholder="请选择文章标签"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                    >
                      <el-option
                        v-for="item in tagOptions"
                        :key="item"
                        :value="item"
                        :label="item"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-col>
        </el-row>

        <div class="editor-container">
          <div id="vditor" />
        </div>
      </div>
    </el-form>
  </div>
</template>
<script>
// import MDinput from '@/components/MDinput'
import Sticky from '@/components/Sticky' // 粘性header组件
import {
  fetchArticleAsync,
  fetchInfo,
  updateArticle,
  addUpdateAndPublish,
  cancelPublish
} from '@/api/article'

import Vditor from 'vditor'
import 'vditor/src/assets/scss/index.scss'
import { formatTime } from '@/utils'
import { getToken } from '@/utils/auth'

var timer = {
  sto: [],
  siv: []
}

const defaultForm = {
  title: '', // 文章题目
  content: '', // 文章内容
  categories: [],
  tags: [],
  id: undefined,
  publish: ''
}
let toolbar
if (window.innerWidth < 768) {
  toolbar = [
    'emoji',
    'headings',
    'bold',
    'italic',
    'strike',
    'link',
    '|',
    'list',
    'ordered-list',
    'check',
    'outdent',
    'indent',
    '|',
    'quote',
    'line',
    'code',
    'inline-code',
    'insert-before',
    'insert-after',
    '|',
    'upload',
    'record',
    'table',
    '|',
    'undo',
    'redo',
    '|',
    'edit-mode',
    'special-function',
    'content-theme',
    'code-theme',
    'export',
    {
      name: 'more',
      toolbar: ['fullscreen', 'both', 'preview', 'info', 'help']
    }
  ]
}
export default {
  name: 'ArticleDetail',
  components: { Sticky },
  props: {
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const validateRequire = (rule, value, callback) => {
      if (value === '') {
        this.$message({
          message: rule.field + '为必传项',
          type: 'error'
        })
        callback(new Error(rule.field + '为必传项'))
      } else {
        callback()
      }
    }
    return {
      editPrepared: 1, // 为2是可以执行赋值 为3时方可执行定时任务（1-> 获取文章内容->2->赋值到编辑器->3）
      contentEditor: Vditor,
      postForm: Object.assign({}, defaultForm),
      loading: false,
      draftLoading: false,
      categoryOptions: [],
      tagOptions: [],
      rules: {
        title: [{ validator: validateRequire }],
        content: [{ validator: validateRequire }]
      },
      tempRoute: {}
    }
  },
  computed: {
    displayTime: {
      // set and get is useful when the data
      // returned by the back end api is different from the front end
      // back end return => '2013-06-25 06:59:25'
      // front end need timestamp => 1372114765000
      get() {
        return +new Date(this.postForm.display_time)
      },
      set(val) {
        this.postForm.display_time = new Date(val)
      }
    }
  },
  mounted() {
    window.vue = this
    this.contentEditor = new Vditor('vditor', {
      // cdn: 'http://localhost:9000',
      toolbar,
      lang: 'zh_CN',
      mode: 'wysiwyg',
      height: window.innerHeight + 100,
      outline: {
        enable: true,
        position: 'right'
      },
      debugger: true,
      typewriterMode: true,
      placeholder: '开始记录你的生活吧!',
      preview: {
        markdown: {
          toc: true,
          mark: true,
          footnotes: true,
          autoSpace: true
        },
        math: {
          engine: 'KaTeX'
        }
      },
      toolbarConfig: {
        pin: true
      },
      counter: {
        enable: true,
        type: 'text'
      },
      hint: {
        emojiPath:
          'https://cdn.jsdelivr.net/npm/vditor@1.8.3/dist/images/emoji',
        emojiTail:
          '<a href="https://ld246.com/settings/function" target="_blank">设置常用表情</a>',
        emoji: {
          sd: '💔',
          j: 'https://unpkg.com/vditor@1.3.1/dist/images/emoji/j.png'
        },
        parse: false,
        extend: [
          {
            key: '@',
            hint: (key) => {
              console.log(key)
              if ('vanessa'.indexOf(key.toLocaleLowerCase()) > -1) {
                return [
                  {
                    value: '@Vanessa',
                    html: '<img src="https://avatars0.githubusercontent.com/u/970828?s=60&v=4"/> Vanessa'
                  }
                ]
              }
              return []
            }
          },
          {
            key: '#',
            hint: (key) => {
              console.log(key)
              if ('vditor'.indexOf(key.toLocaleLowerCase()) > -1) {
                return [
                  {
                    value: '#Vditor',
                    html: '<span style="color: #999;">#Vditor</span> ♏ 一款浏览器端的 Markdown 编辑器，支持所见即所得（富文本）、即时渲染（类似 Typora）和分屏预览模式。'
                  }
                ]
              }
              return []
            }
          }
        ]
      },
      tab: '\t',

      upload: {
        accept: 'image/*,.mp3, .wav, .rar',
        edit: '.svg', // 可以编辑的图片类型
        editUrl:
          process.env.VUE_APP_DRAWIO_PATH + '?embed=1&ui=atlas&spin=1&proto=json&configure=1&lang=zh',
        token: getToken(),
        url: '/api/upload/editor',
        linkToImgUrl: '/api/upload/fetch',
        urlToGetOssCredentials: process.env.VUE_APP_BASE_API + '/upload/policy',
        filename(name) {
          return name
            .replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '')
            .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '')
            .replace('/\\s/g', '')
        }
      },
      after: () => {
        if (this.isEdit) {
          this.contentEditor.disabled()
          // while (this.editPrepared != 2) {
          //   debugger
          // }
          this.editPrepared += 1
          this.contentEditor.setValue(this.postForm.content)
          this.contentEditor.enable()
          // 绑定标题到编辑器
          this.contentEditor.setTitle(this.postForm.title)
        } else {
          // 新文章预先设定值
          // this.contentEditor.setValue('# hello world! ')
        }
        // this.contentEditor.setTheme('dark', 'dark',  'native');
        // document.querySelector('body').style.backgroundColor='#2f363d';
      },
      changeTileFun: function () {
        console.log('覆盖了~')
        window.vue.postForm.title = window.vditor.vditor.contentData.title
        console.log(window.vditor.vditor.contentData.title)
      }
    })
    window.vditor = this.contentEditor
  },
  created() {
    if (this.isEdit) {
      const id = this.$route.params && this.$route.params.id
      this.fetchData(id)
    }
    this.fetchInfos()
    this.autoSaveArticle()
    // Why need to make a copy of this.$route here?
    // Because if you enter this page and quickly switch tag, may be in the execution of the setTagsViewTitle function, this.$route is no longer pointing to the current page
    // https://github.com/PanJiaChen/vue-element-admin/issues/1221
    this.tempRoute = Object.assign({}, this.$route)
  },
  destroyed() {
    // 清除定时保存文章任务
    timer.siv.forEach(function (siv) {
      clearInterval(siv)
    })
  },
  methods: {
    autoSaveArticle() {
      timer.siv.push(setInterval(this.updateArticle, 30000))
    },
    fetchData(id) {
      var response = fetchArticleAsync(id)
      this.postForm = JSON.parse(response.response).data
      this.editPrepared += 1
      this.setTagsViewTitle()
      this.setPageTitle()
    },
    fetchInfos() {
      fetchInfo()
        .then((response) => {
          this.tagOptions = response.data.tag
          this.categoryOptions = response.data.category
        })
        .catch((err) => {
          console.log(err)
        })
    },
    setTagsViewTitle() {
      const title = '编辑文章'
      const route = Object.assign({}, this.tempRoute, {
        title: `${title}-${this.postForm.title}`
      })
      this.$store.dispatch('tagsView/updateVisitedView', route)
    },
    setPageTitle() {
      const title = 'Edit Article'
      document.title = `${title} - ${this.postForm.id}`
    },
    addUpdateAndPublish() {
      console.log(this.postForm)
      this.$refs.postForm.validate((valid) => {
        if (valid) {
          this.loading = true
          this.postForm.publish = true
          addUpdateAndPublish(this.postForm)
            .then((response) => {
              this.$notify({
                title: '发布文章成功',
                type: 'success',
                duration: 2000
              })
              this.postForm.id = response.data.id
              this.postForm.data = response.data.content
              console.log(this.postForm.id)
              var syncTimeElm = document.getElementById('syncTimeDiv')
              syncTimeElm.innerHTML =
                '<span style="cursor: pointer">' +
                '<span>最后更改于<span id="syncTime">' +
                formatTime(new Date()) +
                '</span>' +
                '</span>' +
                '</span>'
              this.loading = false
            })
            .catch((err) => {
              console.log(err)
              this.postForm.publish = false
              this.loading = false
            })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    updateArticle(auto) {
      // 更新同步标签
      debugger
      if (this.isEdit && this.editPrepared !== 3) {
        return
      }
      this.postForm.content = this.contentEditor.getValue()
      if (
        this.postForm.content.length === 0 ||
        this.postForm.title.length === 0
      ) {
        if (auto === false) {
          this.$message({
            message: '请填写必要的标题和内容',
            type: 'warning'
          })
        }

        return
      }
      this.draftLoading = true
      var form = Object.assign({}, this.postForm, {})
      form.publish = undefined
      updateArticle(form)
        .then((response) => {
          if (auto === false) {
            this.$notify({
              title: '保存草稿成功',
              type: 'success',
              duration: 1000
            })
          }
          this.postForm.id = response.data.id
          var syncTimeElm = document.getElementById('syncTimeDiv')
          syncTimeElm.innerHTML =
            '<span style="cursor: pointer">' +
            '<span>最后更改于<span id="syncTime">' +
            formatTime(new Date()) +
            '</span>' +
            '</span>' +
            '</span>'
          this.draftLoading = false
        })
        .catch((err) => {
          console.log(err)
          this.draftLoading = false
        })
    },
    cancelPublish() {
      cancelPublish(this.postForm.id).then((response) => {
        this.$message({ message: '取消发布', type: 'success' })
        this.postForm.publish = false
      })
    }
  }
}
</script>

<style lang='scss'>
@import '~@/styles/mixin.scss';

.createPost-container {
  position: relative;

  .createPost-main-container {
    padding: 40px auto;

    .postInfo-container {
      position: relative;
      padding: 10px 20px 10px 20px;
      @include clearfix;

      .postInfo-container-item {
        float: left;
      }
    }
  }

  .word-counter {
    width: 40px;
    position: absolute;
    right: 10px;
    top: 0px;
  }
}

.article-textarea /deep/ {
  textarea {
    padding-right: 40px;
    resize: none;
    border: none;
    border-radius: 0px;
    border-bottom: 1px solid #bfcbd9;
  }
}

.vditor-title .ne-editor-extra-box {
  max-width: 830px;
  padding: 0 40px;
  margin: 0 auto;
  position: relative;
}

.vditor-title .lake-title-editor {
  font-family: Chinese Quote, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB,
    Microsoft YaHei, Helvetica Neue, Helvetica, Arial, sans-serif,
    Apple Color Emoji;
  position: relative;
  padding-bottom: 4px;
}

.vditor-title .lake-title-editor .ant-input,
.vditor-title .lake-title-editor .ant-input:focus {
  border: none !important;
  outline: none;
  box-shadow: none;
  padding: 0;
}

.vditor-title textarea.ant-input {
  max-width: 100%;
  min-height: 32px;
  line-height: 1.389;
  vertical-align: bottom;
  transition: all 0.3s, height 0s;
}

.vditor-title .ant-input {
  margin: 0;
  font-variant: tabular-nums;
  list-style: none;
  font-feature-settings: 'tnum';
  position: relative;
  display: inline-block;
  width: 100%;
  min-width: 0;
  background-image: none;
  border-radius: 4px;
}

.vditor-title .lake-title {
  color: #262626;
  font-weight: 700 !important;
  font-size: 36px !important;
}

.vditor-title textarea {
  font-family: inherit;
  overflow: auto;
  overflow-x: auto;
  overflow-y: auto;
  font-size: 36px !important;
}

// textarea placeholder color
.vditor-title textarea::-webkit-input-placeholder {
  /* WebKit browsers */
  color: #e6e6e6;
}

.vditor-title textarea:-moz-placeholder {
  /* Mozilla Firefox 4 to 18 */
  color: #e6e6e6;
}

.vditor-title textarea::-moz-placeholder {
  /* Mozilla Firefox 19+ */
  color: #e6e6e6;
}

.vditor-title textarea::-ms-input-placeholder {
  /* Internet Explorer 10+ */
  color: #e6e6e6;
}
.vditor {
  border: none;
  border-top: 1px;
}
</style>
