'use strict';

var domQuery = require('min-dom').query,
  domClear = require('min-dom').clear,
  is = require('bpmn-js/lib/util/ModelUtil').is,
  forEach = require('lodash/forEach'),
  domify = require('min-dom').domify,
  Ids = require('ids').default;

var SPACE_REGEX = /\s/;

// for QName validation as per http://www.w3.org/TR/REC-xml/#NT-NameChar
var QNAME_REGEX = /^([a-z][\w-.]*:)?[a-z_][\w-.]*$/i;

// for ID validation as per BPMN Schema (QName - Namespace)
var ID_REGEX = /^[a-z_][\w-.]*$/i;

var HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function selectedOption(selectBox) {
  if (selectBox.selectedIndex >= 0) {
    return selectBox.options[selectBox.selectedIndex].value;
  }
}

module.exports.selectedOption = selectedOption;

function selectedType(elementSyntax, inputNode) {
  var typeSelect = domQuery(elementSyntax, inputNode);
  return selectedOption(typeSelect);
}

module.exports.selectedType = selectedType;

/**
 * Retrieve the root element the document this
 * business object is contained in.
 *
 * @return {ModdleElement}
 */
function getRoot(businessObject) {
  var parent = businessObject;
  while (parent.$parent) {
    parent = parent.$parent;
  }
  return parent;
}

module.exports.getRoot = getRoot;

/**
 * filters all elements in the list which have a given type.
 * removes a new list
 */
function filterElementsByType(objectList, type) {
  var list = objectList || [];
  var result = [];
  forEach(list, function(obj) {
    if (is(obj, type)) {
      result.push(obj);
    }
  });
  return result;
}

module.exports.filterElementsByType = filterElementsByType;

function findRootElementsByType(businessObject, referencedType) {
  var root = getRoot(businessObject);

  return filterElementsByType(root.rootElements, referencedType);
}

module.exports.findRootElementsByType = findRootElementsByType;

function removeAllChildren(domElement) {
  while (domElement.firstChild) {
    domElement.removeChild(domElement.firstChild);
  }
}

module.exports.removeAllChildren = removeAllChildren;

/**
 * adds an empty option to the list
 */
function addEmptyParameter(list) {
  return list.push({ label: '', value: '', name: '' });
}

module.exports.addEmptyParameter = addEmptyParameter;

/**
 * returns a list with all root elements for the given parameter 'referencedType'
 */
function refreshOptionsModel(businessObject, referencedType) {
  var model = [];
  var referableObjects = findRootElementsByType(businessObject, referencedType);
  forEach(referableObjects, function(obj) {
    model.push({
      label: (obj.name || '') + ' (id=' + obj.id + ')',
      value: obj.id,
      name: obj.name,
    });
  });
  return model;
}

module.exports.refreshOptionsModel = refreshOptionsModel;

/**
 * fills the drop down with options
 */
function updateOptionsDropDown(domSelector, businessObject, referencedType, entryNode) {
  var options = refreshOptionsModel(businessObject, referencedType);
  addEmptyParameter(options);
  var selectBox = domQuery(domSelector, entryNode);
  domClear(selectBox);

  forEach(options, function(option) {
    var optionEntry = domify(
      '<option value="' + escapeHTML(option.value) + '">' + escapeHTML(option.label) + '</option>',
    );
    selectBox.appendChild(optionEntry);
  });
  return options;
}

module.exports.updateOptionsDropDown = updateOptionsDropDown;

/**
 * checks whether the id value is valid
 *
 * @param {ModdleElement} bo
 * @param {String} idValue
 * @param {Function} translate
 *
 * @return {String} error message
 */
function isIdValid(bo, idValue, translate) {
  var assigned = bo.$model.ids.assigned(idValue);

  var idExists = assigned && assigned !== bo;

  if (!idValue || idExists) {
    return translate('Element must have an unique id.');
  }

  return validateId(idValue, translate);
}

module.exports.isIdValid = isIdValid;

function validateId(idValue, translate) {
  if (containsSpace(idValue)) {
    return translate('Id must not contain spaces.');
  }

  if (!ID_REGEX.test(idValue)) {
    if (QNAME_REGEX.test(idValue)) {
      return translate('Id must not contain prefix.');
    }

    return translate('Id must be a valid QName.');
  }
}

module.exports.validateId = validateId;

function containsSpace(value) {
  return SPACE_REGEX.test(value);
}

module.exports.containsSpace = containsSpace;

/**
 * generate a semantic id with given prefix
 */
function nextId(prefix) {
  var ids = new Ids([32, 32, 1]);

  return ids.nextPrefixed(prefix);
}

module.exports.nextId = nextId;

function triggerClickEvent(element) {
  var evt;
  var eventType = 'click';

  if (document.createEvent) {
    try {
      // Chrome, Safari, Firefox
      evt = new MouseEvent(eventType, { view: window, bubbles: true, cancelable: true });
    } catch (e) {
      // IE 11, PhantomJS (wat!)
      evt = document.createEvent('MouseEvent');

      evt.initEvent(eventType, true, true);
    }
    return element.dispatchEvent(evt);
  } else {
    // Welcome IE
    evt = document.createEventObject();

    return element.fireEvent('on' + eventType, evt);
  }
}

module.exports.triggerClickEvent = triggerClickEvent;

function escapeHTML(str) {
  str = '' + str;

  return (
    str &&
    str.replace(/[&<>"']/g, function(match) {
      return HTML_ESCAPE_MAP[match];
    })
  );
}

module.exports.escapeHTML = escapeHTML;

function delModdleByBPMN(id) {
  var flowElements = window.bpmnModeler._definitions.rootElements[0].flowElements;
  const serviceTask = id + '_service';
  const sequenceFlow = id + '_service_flow';
  // 这里用这种--i循环是为了避免splice影响原数组
  for (var i = flowElements.length - 1; i >= 0; i--) {
    const flowId = flowElements[i].$attrs['id'] || flowElements[i]['id'];
    if (flowId == id || flowId == serviceTask || flowId == sequenceFlow) {
      flowElements.splice(i, 1);
    }
  }
}

module.exports.delModdleByBPMN = delModdleByBPMN;

// minuend 被减数 ， reduction 减数
function computedTime(reduction, minuend) {
  // minuend - reduction
  if (minuend.indexOf('H') < 0) {
    if (reduction.indexOf('H') > 0) {
      // 不合法的输入 计算结果为负值
      return;
    }
    // 截止时间-分钟
    if (minuend.indexOf('M') < 0) {
      // 不合法的输入  计算结果为负值  截止时间没有输入
      return;
    }
    if (reduction.indexOf('M') < 0) {
      return minuend;
    } else {
      const reductionTemp = reduction.split('M');
      const minuendTemp = minuend.split('M');
      if (parseInt(minuendTemp) - parseInt(reductionTemp) < 0) {
        // 不合法的输入  计算结果为负值
        return;
      }
      return `${parseInt(minuendTemp) - parseInt(reductionTemp)}M`;
    }
  } else {
    const minuendTemp = minuend.split('H');
    if (reduction.indexOf('H') > 0) {
      // 两个都配置了小时
      const reductionTemp = reduction.split('H');
      const newHour = parseInt(minuendTemp[0]) - parseInt(reductionTemp[0]);

      if (reductionTemp[1].indexOf('M') > 0) {
        // 第一次提醒时间配置了分钟
        const reductionTempMinute = reductionTemp[1].split('M')[0];
        // 截止时间配置了分钟
        if (minuend.indexOf('M') > 0) {
          const minuendTempMinute = minuendTemp[1].split('M')[0];
          if (parseInt(minuendTempMinute) > parseInt(reductionTempMinute)) {
            const newMinute = parseInt(minuendTempMinute) - parseInt(reductionTempMinute);
            return `${newHour}H${newMinute}M`;
          } else {
            // 如果小时相等则结果为负值，不合法
            if (newHour <= 0) {
              return;
            }
            // 需要拿小时减去分钟
            const tempMinute = 60 - parseInt(reductionTempMinute);
            const newMinute = parseInt(minuendTempMinute) + parseInt(tempMinute);
            return `${parseInt(newHour) - 1}H${newMinute}M`;
          }
        } else {
          // 如果小时相等则结果为负值，不合法
          if (newHour <= 0) {
            return;
          }
          // 截止时间没配置分钟
          // 拿小时减去分钟
          const newMinute = 60 - parseInt(reductionTempMinute);
          return `${parseInt(newHour) - 1}H${newMinute}M`;
        }
      } else {
        if (minuend.indexOf('M') > 0) {
          const minuendTempMinute = minuendTemp[1].split('M')[0];
          return `${parseInt(newHour)}H${parseInt(minuendTempMinute)}M`;
        } else {
          // 都没有分钟，判断时间大小
          if (newHour > 0) {
            return `${parseInt(newHour)}H`;
          } else {
            return;
          }
        }
      }
    } else {
      // 截止时间配置了小时
      // 第一次提醒时间没配置小时
      if (reduction.indexOf('M') > 0) {
        // 第一次提醒时间配置了分钟
        const reductionTempMinute = reduction.split('M')[0];
        if (minuendTemp[1].indexOf('M') > 0) {
          // 截止时间配置了分钟
          const minuendTempMinute = minuendTemp[1].split('M');
          if (parseInt(minuendTempMinute) > parseInt(reductionTempMinute)) {
            const newMinute = parseInt(minuendTempMinute) - parseInt(reductionTempMinute);
            return `${minuendTemp[0]}H${newMinute}M`;
          } else {
            const tempMinute = 60 - parseInt(reductionTempMinute);
            const newMinute = parseInt(minuendTempMinute) + parseInt(tempMinute);
            return `${parseInt(minuendTemp[0]) - 1}H${newMinute}M`;
          }
        } else {
          // 截止时间没配置分钟
          const newMinute = 60 - parseInt(reductionTempMinute);
          return `${parseInt(minuendTemp[0]) - 1}H${newMinute}M`;
        }
      } else {
        // 第一次提醒时间没设置值
        return `${minuendTemp[0]}H`;
      }
    }
  }
}

module.exports.computedTime = computedTime;

// beDivisor 被除数 ， divisor 减数
// 计算循环次数
function computedTimeCycle(divisor, beDivisor) {
  // beDivisor / divisor
  if (beDivisor.indexOf('H') < 0) {
    if (beDivisor.indexOf('M') < 0) {
      // 被除数为0
      return 0;
    } else {
      if (divisor.indexOf('H') < 0) {
        if (divisor.indexOf('M') < 0) {
          // 没有输入除数
          return;
        } else {
          const beDivisorTemp = beDivisor.split('M')[0];
          const divisorTemp = divisor.split('M')[0];
          const cycle = Math.floor(parseInt(beDivisorTemp) / parseInt(divisorTemp));
          return cycle;
        }
      } else {
        // 被除数小于除数
        return 0;
      }
    }
  } else {
    const beDivisorTemp = beDivisor.split('H');
    const beDivisorTempHour = beDivisorTemp[0];
    if (divisor.indexOf('H') < 0) {
      if (divisor.indexOf('M') < 0) {
        // 没有输入除数
        return;
      } else {
        const divisorTemp = divisor.split('M')[0];
        if (beDivisor.indexOf('M') < 0) {
          const cycle = Math.floor((parseInt(beDivisorTempHour) * 60) / parseInt(divisorTemp));
          return cycle;
        } else {
          const beDivisorTempMinute = beDivisorTemp[1].split('M')[0];
          const cycle = Math.floor(
            (parseInt(beDivisorTempHour) * 60 + parseInt(beDivisorTempMinute)) /
              parseInt(divisorTemp),
          );
          return cycle;
        }
      }
    } else {
      const divisorTemp = divisor.split('H');
      const divisorTempHour = divisorTemp[0];
      if (beDivisor.indexOf('M') > 0) {
        const beDivisorTempMinute = beDivisorTemp[1].split('M')[0];
        if (divisor.indexOf('M') > 0) {
          const divisorTempMinute = divisorTemp[1].split('M')[0];
          const cycle = Math.floor(
            (parseInt(beDivisorTempHour) * 60 + parseInt(beDivisorTempMinute)) /
              (parseInt(divisorTempHour) * 60 + parseInt(divisorTempMinute)),
          );
          return cycle;
        } else {
          const cycle = Math.floor(
            (parseInt(beDivisorTempHour) * 60 + parseInt(beDivisorTempMinute)) /
              (parseInt(divisorTempHour) * 60),
          );
          return cycle;
        }
      } else {
        if (divisor.indexOf('M') > 0) {
          const divisorTempMinute = divisorTemp[1].split('M')[0];
          const cycle = Math.floor(
            (parseInt(beDivisorTempHour) * 60) /
              (parseInt(divisorTempHour) * 60 + parseInt(divisorTempMinute)),
          );
          return cycle;
        } else {
          const cycle = Math.floor(
            (parseInt(beDivisorTempHour) * 60) / (parseInt(divisorTempHour) * 60),
          );
          return cycle;
        }
      }
    }
  }
}

module.exports.computedTimeCycle = computedTimeCycle;

// 处理边界事件
function toggleBoundaryEvent(type, active, element, bpmnFactory, elementsHelper) {
  let boundaryEvent;
  const bpmnModeler = window.bpmnModeler;
  const modeling = bpmnModeler.get('modeling');
  let elementId = element.id;
  if (active) {
    // 有值
    const moddle = bpmnModeler.get('moddle');
    boundaryEvent = moddle.create('bpmn:BoundaryEvent');
    let tempId = '';
    let eventType = 'timeDuration';
    let expression = moddle.create('bpmn:Expression', {
      body: 'PT' + active,
    });
    if (type === 'timeDuration') {
      element.businessObject.$attrs['timeLimit:timeDuration'] = active;
      tempId = `${elementId}_overtime`;
      // 判断是否配置了第一次提醒时间，是的话需要重新计算
      const firstWarnDuration = element.businessObject.get('timeLimit:firstWarnDuration');
      if (firstWarnDuration) {
        toggleBoundaryEvent(
          'firstWarnDuration',
          firstWarnDuration,
          element,
          bpmnFactory,
          elementsHelper,
        );
      }
    } else if (type === 'firstWarnDuration') {
      // 需要先配置截止时间
      const timeDuration = element.businessObject.get('timeLimit:timeDuration');
      if (!timeDuration) {
        return;
      }
      // timeDuration - firstWarnDuration
      // 计算开始
      const result = computedTime(active, timeDuration);
      if (!result) {
        console.log('不合法');
        return;
      }
      expression = moddle.create('bpmn:Expression', {
        body: 'PT' + result,
      });
      tempId = `${elementId}_timer`;
    } else if (type === 'loopWarnDuration') {
      tempId = `${elementId}_timer_loop`;
      elementId = 'loop';
      eventType = 'timeCycle';
      // 计算开始
      const firstWarnDuration = element.businessObject.get('timeLimit:firstWarnDuration');
      const result = computedTimeCycle(active, firstWarnDuration);
      if (result === void 0) {
        return;
      }
      expression = moddle.create('bpmn:Expression', {
        body: `R${result}/PT${active}`,
      });
    }
    // 先删除原有的
    delModdleByBPMN(tempId);

    boundaryEvent.$attrs['id'] = tempId;
    boundaryEvent.$attrs['cancelActivity'] = 'false';
    boundaryEvent.$attrs['attachedToRef'] = elementId;
    let timerEventDefinition = elementsHelper.createElement(
      'bpmn:TimerEventDefinition',
      {},
      boundaryEvent,
      bpmnFactory,
    );
    timerEventDefinition.set(eventType, expression);

    boundaryEvent.set('eventDefinitions', [timerEventDefinition]);

    bpmnModeler._definitions.rootElements[0].flowElements.push(boundaryEvent);
    // 设置服务任务节点
    let serviceTask = moddle.create('bpmn:ServiceTask');
    serviceTask.$attrs['id'] = tempId + '_service';
    serviceTask.$attrs['flowable:delegateExpression'] = '${executionTimerDelegate}';
    // 设置流程线
    let sequenceFlow = moddle.create('bpmn:SequenceFlow');
    sequenceFlow.$attrs['id'] = tempId + '_service_flow';
    sequenceFlow.$attrs['sourceRef'] = tempId;
    sequenceFlow.$attrs['targetRef'] = tempId + '_service';
    bpmnModeler._definitions.rootElements[0].flowElements.push(serviceTask);
    bpmnModeler._definitions.rootElements[0].flowElements.push(sequenceFlow);
  }
}

module.exports.toggleBoundaryEvent = toggleBoundaryEvent;

// 处理定时启动事件
function toggleTimerEvent(type, active, element, bpmnFactory, elementsHelper) {
  const bpmnModeler = window.bpmnModeler;
  const modeling = bpmnModeler.get('modeling');
  let elementId = element.id;
  if (active) {
    // 有值
    let eventType = 'timeDuration';
    if (type === 'startTime') {
      eventType = 'timeDate';
      const loopTime = element.businessObject.get('timeLimit:loopTime');
      if (loopTime) {
        const loopTimeTemp = loopTime.split('/');
        active = `${loopTimeTemp[0]}/${active}/${loopTimeTemp[1]}`;
      }
    } else if (type === 'continuedTime') {
      eventType = 'timeDuration';
    } else if (type === 'loopTime') {
      eventType = 'timeCycle';
      const startTime = element.businessObject.get('timeLimit:startTime');
      if (startTime) {
        const loopTimeTemp = active.split('/');
        active = `${loopTimeTemp[0]}/${startTime}/${loopTimeTemp[1]}`;
      }
    }

    const moddle = bpmnModeler.get('moddle');
    let expression = moddle.create('bpmn:Expression', {
      body: active,
    });
    let timerEventDefinition = elementsHelper.createElement(
      'bpmn:TimerEventDefinition',
      {},
      element,
      bpmnFactory,
    );
    timerEventDefinition.set(eventType, expression);
    return timerEventDefinition;
  }
}

module.exports.toggleTimerEvent = toggleTimerEvent;

// 删除所有的边界事件
function clearBoundaryEvent() {
  var flowElements = window.bpmnModeler._definitions.rootElements[0].flowElements;
  // 这里用这种--i循环是为了避免splice影响原数组
  for (var i = flowElements.length - 1; i >= 0; i--) {
    const flowId = flowElements[i].$attrs['id'] || flowElements[i]['id'];
    if (flowElements[i].$type === 'bpmn:BoundaryEvent' && (flowId.endsWith('_overtime') || flowId.endsWith('_timer') || flowId.endsWith('_timer_loop'))) {
      flowElements.splice(i, 1);
    } else if(flowElements[i].$type === 'bpmn:ServiceTask' && flowId.endsWith('_service')) {
      flowElements.splice(i, 1);
    } else if(flowElements[i].$type === 'bpmn:SequenceFlow' && flowId.endsWith('_service_flow')) {
      flowElements.splice(i, 1);
    }
  }
}

module.exports.clearBoundaryEvent = clearBoundaryEvent;
