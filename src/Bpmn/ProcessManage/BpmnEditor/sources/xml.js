export default function getDefaultXml() {
  const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
    <bpmn2:definitions
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
      xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
      xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
      xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
      xmlns:assignee="http://flowable.org/bpmn/assignee"
      xmlns:normal="http://flowable.org/bpmn/normal"
      xmlns:approvalRule="http://flowable.org/bpmn/approvalRule" 
      xmlns:approvalDetail="http://flowable.org/bpmn/approvalDetail" 
      xmlns:signRule="http://flowable.org/bpmn/signRule" 
      xmlns:timeLimit="http://flowable.org/bpmn/timeLimit" 
      xmlns:nodeEvent="http://flowable.org/bpmn/nodeEvent"
      xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"
      id="sample-diagram"
      targetNamespace="http://www.flowable.org/processdef"
    >
      <bpmn2:process id="Process_1" isExecutable="true" name="" normal:isGreen="0" >
        <extensionElements>
          <flowable:executionListener event="start" class="com.dhcc.workflow.listener.ExecutionStartListener" />
          <flowable:executionListener event="end" class="com.dhcc.workflow.listener.ExecutionEndListener" />
        </extensionElements>
      </bpmn2:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1" >
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </bpmn2:definitions>`;

  return diagramXML;
}
