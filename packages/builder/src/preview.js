// import lab from 'lab.js'
// import * as lab2 from 'lab.js/dist/lab.legacy'

console.log(lab)
const studyTree = JSON.parse(window.localStorage.getItem('STUDY_TREE_HACK'))
const study = lab.core.deserialize(studyTree)
study.run()
