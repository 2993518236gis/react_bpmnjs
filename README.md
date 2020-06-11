# react + bpmn-js + antd实现流程设计器和流程跟踪

## 1. Bpmn.js简介

bpmn.js是一个BPMN2.0渲染工具包和web建模器.

它使用JavaScript编写，在不需要后端服务器支持的前提下向现代浏览器内嵌入BPMN2.0流程图.

在线测试: [在线绘制bpmn流程图](https://demo.bpmn.io/)



## 2. 实现流程设计器

首先，我们先来看看整体结构

![](./static\modeler1.png)



记住上面图中的文字



### 2.1 自定义左侧工具栏（pallete）

首先先看一下目录结构

![](./static\modeler2.png)



在CustomPalette.js文件中实现左侧工具栏，默认bpmn-js的工具栏有很多节点，但一些节点不是我们需要的；所以这里自定义。

首先这个`js`是导出一个类(类的名称你可以随意取, 但是在引用的时候不能随意取, 后面会说到):

这里我就取为`CustomPalette`:

```js
// CustomPalette.js
export default class CustomPalette {
    constructor(bpmnFactory, create, elementFactory, palette, translate) {
        this.bpmnFactory = bpmnFactory;
        this.create = create;
        this.elementFactory = elementFactory;
        this.translate = translate;

        palette.registerProvider(this);
    }
    // 这个函数就是绘制palette的核心
    getPaletteEntries(element) {}
}

CustomPalette.$inject = [
    'bpmnFactory',
    'create',
    'elementFactory',
    'palette',
    'translate'
]
```



上面👆的代码很好理解:

- 定义一个类
- 使用`$inject`注入一些需要的变量
- 在类中使用`palette.registerProvider(this)`指定这是一个`palette`

定义完`CustomPalette.js`之后, 我们需要在其同级的`index.js`中将它导出:

```js
// custom/index.js
import CustomPalette from './CustomPalette'

export default {
    __init__: ['customPalette'],
    customPalette: ['type', CustomPalette]
}
```

**注:️** 这里`__init__`中的名字就必须是`customPalette`了, 还有下面的属性名也必须是`customPalette`, 不然就会报错了.

同时要在页面中使用它:

```js
<script>
    
import customModule from './custom';

this.bpmnModeler = new BpmnModeler({
    additionalModules: [
        // 左边工具栏以及节点
        propertiesProviderModule,
        // 自定义的节点
        customModule
    ]
})

</script>
```



#### 编写核心函数getPaletteEntries代码

抛开这些不看, 重点就是如何构造这个`getPaletteEntries`函数

函数的名称你不能变, 不然会报错, 首先它返回的是一个对象, 对象中指定的就是你要自定义的项, 它大概长成这样:

```
// CustomPalette.js
getPaletteEntries(element) {
    return {
        'create.user-task': {
            group: 'activity', // 分组名
            className: 'bpmn-icon-user-task', // 样式类名
            title: translate('用户任务节点'),
            action: { // 操作
                dragstart: createTask(), // 开始拖拽时调用的事件
                click: createTask() // 点击时调用的事件
            }
        }
    }
}
```

可以看到我定义的一项的名称就是: create.user-task. 它会有几个固定的属性:

- group: 属于哪个分组, 比如`tools、event、gateway、activity`等等,用于分类
- className: 样式类名, 我们可以通过它给元素修改样式
- title: 鼠标移动到元素上面给出的提示信息
- action: 用户操作时会触发的事件



> Q: 在这个项目中我们如何添加新的节点？

比如说我添加一个服务任务节点

![](./static\modeler3.png)

只需要在CustomPalette.js文件中添加红框中的代码就可以了

最后在index.js文件中引入CustomPalette.js文件

```js
import PaletteModule from './palette';
import CustomPalette from './CustomPalette';

export default {
    __depends__: [PaletteModule],
    __init__: ['paletteProvider'],
    paletteProvider: ['type', CustomPalette],
};
```



可能你注意到了\__init__里用的是paletteProvider，这表示的是完全自定义；如果使用customPalette表示的在原来的基础上扩展。



### 2.2 自定义Context-Pad

其实自定义`contextPad`和`palette`很像, 只不过是使用`contextPad.registerProvider(this)`来指定它是一个`contextPad`, 而自定义`palette`是用`platette.registerProvider(this)`.

代码如下:

```
// CustomContextPad.js
export default class CustomContextPad {
    constructor(config, contextPad, create, elementFactory, injector, translate) {
        this.create = create;
        this.elementFactory = elementFactory;
        this.translate = translate;

        if (config.autoPlace !== false) {
            this.autoPlace = injector.get('autoPlace', false);
        }

        contextPad.registerProvider(this); // 定义这是一个contextPad
    }

    getContextPadEntries(element) {}
}

CustomContextPad.$inject = [
    'config',
    'contextPad',
    'create',
    'elementFactory',
    'injector',
    'translate'
];
```

相信大家都已经看出来了, 重点还是在于`getContextPadEntries`这个方法, 接下来让我们来构建这个方法.

#### 编写`getContextPadEntries`代码

其实这个方法, 需要返回的也是一个对象, 也就是你要在`contextPad`这个容器里显示哪些自定义的元素, 比如我这里需要给容器里添加一个`usertask`的元素, 那么我们可以在返回的对象中添加上`append.user-task`这个属性.

而属性值就是这个元素的一系列配置, 和`palette`中一样, 包括:

- group: 属于哪个分组, 比如`tools、event、gateway、activity`等等,用于分类
- className: 样式类名, 我们可以通过它给元素修改样式
- title: 鼠标移动到元素上面给出的提示信息
- action: 用户操作时会触发的事件

大概是这样:

```
// CustomContextPad.js
getContextPadEntries(element) {
    return {
       'append.user-task': {
             group: 'model',
             className: 'bpmn-icon-user-task',
             title: translate('Append')+' '+translate('UserTask'),
             action: {
                 click: appendUserTask,
                 dragstart: appendUserTaskStart
             }
         },
    };
}
```

接下来就是构建`appendTask`和`appendTaskStart`

```
// CustomContextPad.js
getContextPadEntries(element) {
        const {
            autoPlace,
            create,
            elementFactory,
            translate
        } = this;

        function appendUserTask(event, element) {
            if (autoPlace) {
                const shape = elementFactory.createShape({ type: 'bpmn:UserTask' });
                autoPlace.append(element, shape);
            } else {
                appendUserTaskStart(event, element);
            }
        }

        function appendUserTaskStart(event) {
            const shape = elementFactory.createShape({ type: 'bpmn:UserTask' });
            create.start(event, shape, element);
        }

        return {
            'append.user-task': {
             	group: 'model',
             	className: 'bpmn-icon-user-task',
             	title: translate('Append')+' '+translate('UserTask'),
             	action: {
                	click: appendUserTask,
                 	dragstart: appendUserTaskStart
             	}
         	},
        };
    }
}
```



> Q: 如何创建一个新的节点呢？

复制return中的user-task对象然后将对应值改成你想要的就可以了



最后同样的操作：导出

```js
import CustomContextPad from './CustomContextPad';

export default {
    __init__: ['contextPadProvider'],
    contextPadProvider: ['type', CustomContextPad],
};
```



contextPadProvider表示完全自定义



### 2.3 自定义翻译

因为bpmn.js是国外的，所以我们国内用需要翻译成中文，方法和palette一样，新建CustomTranslate.js文件；具体结合项目查看

![](./static\modeler4.png)





最后将上面三个自定义都引入index.js文件

![](./static\modeler5.png)



使用：

```js
import BpmnModeler from './BpmnEditor/Modeler'; // 上面说的index.js文件

this.bpmnModeler = new BpmnModeler({
    container: '#canvas',
    propertiesPanel: {
        parent: '#properties-panel',
    },
});
```





### 2.4 自定义属性面板（properties-panel）



首先是安装上.

如果你想要使用它的话, 得自己安装一下:

```
$ npm install --save bpmn-js-properties-panel
```

同样的记得在项目中引入样式:

```
import 'bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css' // 右边工具栏样式
```

使用上, 得在`html`代码中提供一个标签作为盛放它的容器:

```
<div id="properties-panel"></div>
```

之后, 在构建`BpmnModeler`的时候添加上它:

```js
// 这里引入的是右侧属性栏这个框
import propertiesPanelModule from './bpmn-js-properties-panel/lib'; // 自定义的属性面板
// 引入flowable的节点文件
import flowableModdle from '../static/flowModel/flowable.json';
// 而这个引入的是右侧属性栏里的内容
import propertiesProviderModule from './bpmn-js-properties-panel/lib/provider/flowable';

this.bpmnModeler = new BpmnModeler({
     container: '#canvas',
     propertiesPanel: {
       parent: '#properties-panel',
     },
     additionalModules: [
       propertiesPanelModule, 
       propertiesProviderModule
     ],
     moddleExtensions: {
       flowable: flowableModdle,
     },
 });
```



这个是官方的属性面板，如果要添加自定义的属性怎么办呢？



官方的属性面板不好控制，于是我自定义了属性面板(将camunda的属性面板源码拿过来改的)。

![](./static\modeler6.png)



在`FlowablePropertiesProvider.js`文件中，添加我们需要的属性，比如：**必经节点**

首先`FlowablePropertiesProvider.js`文件中引入

```js
// 是否是必经节点
var isMajorProps = require('./parts/IsMajorProps');
```

调用引入的isMajorProps方法

```js
// 是否是必经节点
  isMajorProps(generalGroup, element, bpmnFactory, translate);
// generalGroup是一个数组，主要用于传值
// 其他的不用管，自带的
```



我们来看看`IsMajorProps`这个文件内容：

```js
'use strict';
import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';
var is = require('bpmn-js/lib/util/ModelUtil').is,
  getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

module.exports = function(group, element, bpmnFactory, translate) {
  var businessObject = getBusinessObject(element);
  if (is(element, 'bpmn:UserTask')) {
    const isMajor = entryFactory.selectBox({
      id: 'isMajor',
      label: translate('必经节点'),
      modelProperty: 'isMajor',
      selectOptions: [
        { name: '', value: '' },
        { name: '是', value: '0' },
        { name: '否', value: '1' },
      ],
    });

    // 设置默认值
    if (!businessObject.get('isMajor')) {
      businessObject.$attrs['isMajor'] = '0';
    }

    group.entries = group.entries.concat(isMajor);
  }
};

```



其实就是将一个对象添加到`generalGroup`数组中。我们提出重要部分进行讲解

```js
const isMajor = entryFactory.selectBox({
      id: 'isMajor',
      label: translate('必经节点'),
      modelProperty: 'isMajor',
      selectOptions: [
        { name: '', value: '' },
        { name: '是', value: '0' },
        { name: '否', value: '1' },
      ],
    });

```



- `selectBox` 表示的是下拉框，还有输入框等，你可以进入entryFactory中查看
- `id`表示的是dom唯一标识，和普通的html中的id作用一样
- `label`相信你看名字就知道了，输入的是属性中文描述
- `modelProperty`这个是真正插入xml中的属性
- `selectOptions`就是下拉框中的值
- `translate`表示的是翻译，你也可以直接输入中文，输入因为的话，会到上文中说的翻译文件中去查



我们再找一个输入框的看看:

```js
var versionTagEntry = entryFactory.textField({
    id: 'versionTag',
    label: translate('Version Tag'),
    modelProperty: 'versionTag'
});
```

- `entryFactory.textField`表示的是输入框

  



#### 怎么将自定义的属性面板和BpmnModeler结合



只需要在使用时，引入本地自定义的就可以啦🤔️

```js
// 这里引入的是右侧属性栏这个框
import propertiesPanelModule from './bpmn-js-properties-panel/lib';
// 引入flowable的节点文件
import flowableModdle from '../static/flowModel/flowable.json';
// 而这个引入的是右侧属性栏里的内容
import propertiesProviderModule from './bpmn-js-properties-panel/lib/provider/flowable';


this.bpmnModeler = new BpmnModeler({
    container: '#canvas',
    propertiesPanel: {
        parent: '#properties-panel',
    },
    additionalModules: [
        propertiesPanelModule, 
        propertiesProviderModule,
    ],
    moddleExtensions: {
        flowable: flowableModdle,
    },
});
```





## 3. 属性面板拓展功能

### 3.1 拓展下拉选择框可以多选

**查看案例**：`受理人`



![](E:\project\github\react_bpmnjs\static\assigneeList.png)



```js
entryFactory.selectBox({
    id: 'assigneeList',
    label: translate('受理人'),
    selectOptions:
    function(element) {
        return getData();
    },
    modelProperty: 'assigneeList',
    multiple: 'multiple', // 加上这个方法变成多选下拉框
    get: function(element) {
        var attr = getAttribute(element, 'assigneeList');
        return attr;
    },

    set: function(element, values) {
        const bo = getBusinessObject(element);
        return cmdHelper.updateBusinessObject(element, bo, values);
    },
}),
```



只需要加上`multiple`属性即可



### 3.2 异步请求

`bpmn-js-properties-panel`提供的属性面板是不支持异步请求的，但我们正常业务中，很多场景都需要**请求后台获取数据**，**本项目封装了异步请求实现**，具体案例请看`受理人`

```js
module.exports = function(group, element, bpmnFactory, translate) {

  if(!is(element, 'bpmn:UserTask')) {
    return;
  }

  function getData() {
    return new Promise(function (resolve, reject) {
      setTimeout(() => {
        const data = [
          {name: '张三', value: 'zhangsan'},
          {name: '李四', value: 'lisi'}
        ]
        console.log('进入异步方法里');
        resolve(data)
      }, 2000);
      console.log('先执行这里');
    });
  }

  function getAttribute(element, prop) {
    let attr = {};
    const bo = getBusinessObject(element);
    var value = bo.get(prop);
    attr[prop] = value;
    return attr;
  }

  group.entries.push(
    entryFactory.selectBox({
      id: 'assigneeList',
      label: translate('受理人'),
      selectOptions:
        function(element) {
          return getData();
        },
      modelProperty: 'assigneeList',
      multiple: 'multiple', // 加上这个方法变成多选下拉框
      get: function(element) {
        var attr = getAttribute(element, 'assigneeList');
        return attr;
      },

      set: function(element, values) {
        const bo = getBusinessObject(element);
        return cmdHelper.updateBusinessObject(element, bo, values);
      },
    }),
  );

};
```



代码中，通过`getData`获取下拉框的数据，`getData`通过`Promise`将异步请求转为同步请求，你可以亲自运行项目查看`console`输出顺序。



### 3.3 时间相关组件

![](E:\project\github\react_bpmnjs\static\time.png)



查看案例如图

**(1) 年月日这种ISO 8601格式组件调用方法**

案例：

```js
group.entries.push(entryFactory.dateField({
    id: 'startTime',
    label: '开始时间',
    modelProperty: 'startTime',
    description: 'ISO 8601格式',
    get: function(element) {
      return {
        'startTime': getAttribute(element, 'startTime')
      }
    },
    set: function(element, values) {
      const bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, values);
    }
  }));
```



通过`entryFactory.dateField`创建就可以啦



**(2) 小时、分钟这种组件调用方式**

```js
const node = entryFactory.timeField({
    id: 'warnDuration',
    label: '提醒时间',
    modelProperty: 'warnDuration',
    get: function(element) {
      let hour = '0';
      let minute = '0';
      const warnDuration = bo.get('warnDuration');
      if (warnDuration) {
        if (warnDuration.indexOf('H') > 0) {
          const warnDurationTemp = warnDuration.split('H');
          // 小时
          hour = warnDurationTemp[0];
          if (warnDuration.indexOf('M') > 0) {
            // 分钟
            const minute = warnDurationTemp[1].split('M')[0];
            return {
              'warnDuration-h': hour,
              'warnDuration-m': minute,
            };
          } else {
            return {
              'warnDuration-h': hour,
            };
          }
        } else {
          if (warnDuration.indexOf('M') > 0) {
            // 分钟
            const minute = warnDuration.split('M')[0];
            return {
              'warnDuration-m': minute,
            };
          } else {
            return {};
          }
        }
      }
      return {};
    },

    set: function(element, values) {
      const domHour = domQuery('input[id="warnDuration-h"');
      const domMinute = domQuery('input[id="warnDuration-m"');
      let newValue = '';
      if (domHour.value) {
        if (domMinute.value) {
          newValue = `${domHour.value}H${domMinute.value}M`;
        } else {
          newValue = `${domHour.value}H`;
        }
      } else if (domMinute.value) {
        newValue = `0H${domMinute.value}M`;
      }
      const attrs = {};
      attrs['warnDuration'] = newValue;

      return cmdHelper.updateBusinessObject(element, bo, attrs);
    },
    validate: function(element, values) {
      let validationResult = {};
      return validationResult;
      
    },
  });
  group.entries.push(node);
```



通过`entryFactory.timeField`创建就可以啦



## 4. 流程校验

请移步这里：[基于bpmn-js的流程设计器校验实现](https://github.com/griabcrh/bpmn-js-bpmnlint)



## 5 支持

写文章不容易，如果你觉得文章对你有帮助别忘了给个`star`😄😄😄



如果你有好的关于bpmn-js的使用方法、解决思路、文章可以联系`易样(作者)`投稿👏👏👏，微信号：crh2466882596



如果你遇到问题可以在`issue`中提出，也可以进群交流

![](E:\project\github\react_bpmnjs\static\qun.png)



进群二维码失效请联系作者
