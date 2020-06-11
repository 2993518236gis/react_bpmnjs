import { assign } from 'min-dash';

export default class CustomContextPad {
    constructor(config, contextPad, create, elementFactory, injector, translate, modeling, connect) {
        this.create = create;
        this.elementFactory = elementFactory;
        this.translate = translate;
        this.modeling = modeling;
        this.connect = connect;
        //自动摆放位置
        if (config.autoPlace !== false) {
            this.autoPlace = injector.get('autoPlace', false);
        }
        //注册工具
        contextPad.registerProvider(this);
    }
    getContextPadEntries(element) {
        const {
            autoPlace,
            create,
            elementFactory,
            translate,
            modeling,
            connect
        } = this;

          function appendAction(type, className, title, options) {

            if (typeof title !== 'string') {
            options = title;
            title = translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
            }

            function appendStart(event, element) {

            var shape = elementFactory.createShape(assign({ type: type }, options));
            create.start(event, shape, {
                source: element
            });
            }


            var append = autoPlace ? function(event, element) {
            var shape = elementFactory.createShape(assign({ type: type }, options));

            autoPlace.append(element, shape);
            } : appendStart;


            return {
            group: 'model',
            className: className,
            title: title,
            action: {
                dragstart: appendStart,
                click: append
            }
            };
        }

        function startConnect(event, element) {
            connect.start(event, element);
        }

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
        function appendCallActivityStart(event) {
            const shape = elementFactory.createShape({ type: 'bpmn:CallActivity' });
            create.start(event, shape, element);
        }

        function appendCallActivity(event, element) {
            if (autoPlace) {
                const shape = elementFactory.createShape({ type: 'bpmn:CallActivity' });
                autoPlace.append(element, shape);
            } else {
                appendCallActivityStart(event, element);
            }
        }

        function removeElement(e) { // 点击的时候实现删除功能
            modeling.removeElements([element])
        }
        var actions = {};

        if (element.type === 'label') {
            return actions;
        }
        
        if(element.type === 'bpmn:UserTask' || element.type === 'bpmn:CallActivity' || element.type === 'bpmn:ServiceTask' || element.type === 'bpmn:SequenceFlow' || element.type === 'bpmn:StartEvent'  || element.type === 'bpmn:ExclusiveGateway'  || element.type === 'bpmn:InclusiveGateway'  || element.type === 'bpmn:ParallelGateway' ) {
          actions = {
            'append.end-event': appendAction(
                'bpmn:EndEvent',
                'bpmn-icon-end-event-none',
                translate('Append EndEvent')
            ),
            'append.gateway': appendAction(
                'bpmn:ExclusiveGateway',
                'bpmn-icon-gateway-none',
                translate('Append Gateway')
            ),
            'append.intermediate-event': appendAction(
                'bpmn:IntermediateThrowEvent',
                'bpmn-icon-intermediate-event-none',
                translate('Append Intermediate/Boundary Event')
            ),
            'append.user-task': {
                group: 'model',
                className: 'bpmn-icon-user-task',
                title: translate('Append')+' '+translate('UserTask'),
                action: {
                    click: appendUserTask,
                    dragstart: appendUserTaskStart
                }
            },
            'append.call-activity':{
                group: 'model',
                className: 'bpmn-icon-call-activity',
                title: translate('Append CallActivity'),
                action: {
                    click: appendCallActivity,
                    dragstart: appendCallActivityStart
                }
            },
            'connect': {
                group: 'connect',
                className: 'bpmn-icon-connection-multi',
                title: translate('Connect using DataInputAssociation'),
                action: {
                click: startConnect,
                dragstart: startConnect
                }
            }
          }
        } else {
          actions = {}
        }
        // 所有节点都有删除
        assign(actions, {
            'delete': {
                group: 'edit',
                className: 'bpmn-icon-trash',
                title: translate('Remove'),
                action: {
                click: removeElement
                }
            }
        });
        return actions;
        
    }
}
CustomContextPad.$inject = [
    'config',
    'contextPad',
    'create',
    'elementFactory',
    'injector',
    'translate',
    'modeling',
    'connect'
];