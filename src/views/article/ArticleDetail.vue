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
            <el-form-item style="margin-bottom: 40px" prop="title">
              <MDinput
                v-model="postForm.title"
                :maxlength="100"
                name="name"
                required
              >
                Title
              </MDinput>
            </el-form-item>

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
          <markdown-editor v-model="postForm.content" :options="mdOptions" />
        </div>
      </div>
    </el-form>
  </div>
</template>

<script>
// import Upload from '@/components/Upload/SingleImage3'
import MDinput from '@/components/MDinput'
import Sticky from '@/components/Sticky' // 粘性header组件
import {
  fetchArticle,
  fetchInfo,
  updateArticle,
  // createArticle,
  cancelPublish,
  addUpdateAndPublish
} from '@/api/article'
import { policy } from '@/api/file'
import uuid from 'uuid'
import MarkdownEditor from '@/components/MarkdownEditor'

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

export default {
  name: 'ArticleDetail',
  components: { MarkdownEditor, MDinput, Sticky },
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
      postForm: Object.assign({}, defaultForm),
      loading: false,
      draftLoading: false,
      categoryOptions: [],
      tagOptions: [],
      rules: {
        title: [{ validator: validateRequire }],
        content: [{ validator: validateRequire }]
      },
      tempRoute: {},
      mdOptions: {
        toolbarItems: ['heading', 'bold', 'italic'],
        hooks: {
          // https://github.com/nhnent/tui.editor/issues/57
          addImageBlobHook: this.upload_file_with_callback
        }
      }
    }
  },
  computed: {
    displayTime: {
      // set and get is useful when the data
      // returned by the back end api is different from the front end
      // back end return => "2013-06-25 06:59:25"
      // front end need timestamp => 1372114765000
      get() {
        return +new Date(this.postForm.display_time)
      },
      set(val) {
        this.postForm.display_time = new Date(val)
      }
    }
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
    upload_file_with_callback(blob, callback) {
      policy(this.postForm.title).then((response) => {
        console.log(response)
        const OSS = require('ali-oss')
        // let STS = OSS.STS;
        // let sts = new STS({
        //   // 阿里云主账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM账号进行API访问或日常运维，请登录RAM控制台创建RAM账号。
        //   accessKeyId: response.data.accessKeyId,
        //   accessKeySecret: response.data.accessKeySecret,
        // });
        const ossStaticHost = response.data.ossStaticHost
        try {
          // object-key可以自定义为文件名（例如file.txt）或目录（例如abc/test/file.txt）的形式，实现将文件上传至当前Bucket或Bucket下的指定目录。
          // let token = await sts.assumeRole(
          //   "<role-arn>",
          //   "<policy>",
          //   "<expiration>",
          //   "<session-name>"
          // );
          var client = OSS({
            accessKeyId: response.data.accessKeyId,
            accessKeySecret: response.data.accessKeySecret,
            stsToken: response.data.securityToken,
            bucket: response.data.bucket,
            region: response.data.region
          })
          // 文章 名称 去除空格
          var title = this.postForm.title.replaceAll(' ', '')
          // 上传  文件名
          var filename = uuid().replace(/-/g, '') + '.' + blob.type.split('/').pop()
          // 上传相对于整个bucket（图床）路径名
          var ext = title + '/' + filename
          // 文章中显示的地址
          var filePath = ossStaticHost + title + '/' + filename
          client.put(ext, blob).then((result) => {
            // console.log(result)
            // console.log(uuid())
            // console.log(blob)

            callback(filePath, '')
          })
          // console.log(result);
          // callback(response.data, '')
        } catch (e) {
          console.log(e)
        }
      })
      // var title = this.postForm.title
      // var formdata = new FormData()
      // formdata.append('file', blob)
      // formdata.append('title', title)
      // upload(formdata).then(response => {
      //   callback(response.data, '')
      // })
    },
    fetchData(id) {
      fetchArticle(id)
        .then((response) => {
          this.postForm = response.data

          // just for test
          // this.postForm.title += `   Article Id:${this.postForm.id}`
          // this.postForm.content_short += `   Article Id:${this.postForm.id}`

          // set tagsview title
          this.setTagsViewTitle()

          // set page title
          this.setPageTitle()
        })
        .catch((err) => {
          console.log(err)
        })
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
          addUpdateAndPublish(this.postForm).then((response) => {
            this.$notify({
              title: '发布文章成功',
              type: 'success',
              duration: 2000
            })
            this.postForm.id = response.data.id
            this.postForm.data = response.data.content
            console.log(this.postForm.id)
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
      if (
        this.postForm.content.length === 0 ||
        this.postForm.title.length === 0
      ) {
        this.$message({
          message: '请填写必要的标题和内容',
          type: 'warning'
        })
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

<style lang="scss" scoped>
@import '~@/styles/mixin.scss';

.createPost-container {
  position: relative;

  .createPost-main-container {
    padding: 40px 45px 20px 50px;

    .postInfo-container {
      position: relative;
      @include clearfix;
      margin-bottom: 10px;

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
</style>
