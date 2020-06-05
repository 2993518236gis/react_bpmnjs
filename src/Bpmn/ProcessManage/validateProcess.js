import { Linter } from 'bpmnlint';
import * as bpmnlintConfig from './packed-config';
import { message } from 'antd';

// 校验流程是否能正常流通
export async function validateProcess() {
  let result = true;
  const modelRoot = window.bpmnModeler.get('canvas').getRootElement();
  var linter = new Linter(bpmnlintConfig);
  const results = linter.lint(modelRoot.businessObject);
  await results.then(res => {
    for(let items of Object.values(res)) {
      items.forEach(it => {
        if(it.category === 'error') {
          result = false;
          message[it.category](it.message);
        } else {
          message[it.category](it.message)
        }
        
      });
    }
  });
  return result;
}

// 校验流程中的必输项
export function validateRequired() {
  let flag = true;
  const results = [];
  const canvas = window.bpmnModeler.get('canvas');
  const rootElement = canvas.getRootElement();
  const childs = rootElement.children;
  childs.forEach(child => {
    if(child.type === 'bpmn:UserTask') {
      // 判断用户任务必输项
      const bo = child.businessObject;
      if(!bo.get('normal:nodeType')) {
        results.push(`用户任务${bo.name}：节点类型属性为必输项`);
        flag = false;
      }
      if(!bo.get('normal:type')) {
        results.push(`用户任务${bo.name}：审批方式属性为必输项`);
        flag = false;
      }
      if(bo.get('assignee:assigneeList') && !bo.get('assignee:assign')) {
        results.push(`用户任务${bo.name}：配置了执行人，必须选择执行人分配策略`);
        flag = false;
      }

    }
  });

  return {flag: flag, results: results};
}