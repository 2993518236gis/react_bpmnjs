import React, { PureComponent } from 'react';
import { notification } from 'antd';
import FullModal from '@/widgets/FullModal';
// Bpmn 相关文件
// 这里引入的是右侧属性栏这个框
import propertiesPanelModule from './bpmn-js-properties-panel/lib';
// 引入flowable的节点文件
import flowableModdle from '../static/flowModel/flowable.json';
// 而这个引入的是右侧属性栏里的内容
import propertiesProviderModule from './bpmn-js-properties-panel/lib/provider/flowable';
import EditingTools from './BpmnEditor/EditingTools';
import BpmnModeler from './BpmnEditor/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import getDefaultXml from './BpmnEditor/sources/xml';
import styles from './BpmnEditor/sources/Bpmn.less';
import lintModule from 'bpmn-js-bpmnlint';
import fileDrop from 'file-drops';
import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css';
import * as bpmnlintConfig from './packed-config';

class ProcessDesign extends PureComponent {
  state = {
    scale: 1, // 流程图比例
    svgVisible: false, // 预览图片
    svgSrc: '', // 图片地址
    bpmnModeler: null
  };

  componentDidMount() {
    const that = this;
    this.bpmnModeler = new BpmnModeler({
      container: '#canvas',
      propertiesPanel: {
        parent: '#properties-panel',
      },
      linting: {
        bpmnlint: bpmnlintConfig,
        active: that.getUrlParam('linting')
      },
      additionalModules: [
        propertiesPanelModule, 
        propertiesProviderModule,
        lintModule
      ],
      moddleExtensions: {
        flowable: flowableModdle,
      },
      height: '100%',
      width: '100%'
    });
    const diagramXML = getDefaultXml();
    this.renderDiagram(diagramXML);

    this.bpmnModeler.on('linting.toggle', function(event) {
      const active = event.active;
      that.setUrlParam('linting', active);
    });
    const dndHandler = fileDrop('Drop BPMN Diagram here.', function(files) {
      this.bpmnModeler.importXML(files[0].contents);
    });
    document.querySelector('body').addEventListener('dragover', dndHandler);

    window.bpmnModeler = this.bpmnModeler;
    // 删除 bpmn logo  bpmn.io官方要求不给删或者隐藏，否则侵权
    // const bjsIoLogo = document.querySelector('.bjs-powered-by');
    // while (bjsIoLogo.firstChild) {
    //     bjsIoLogo.removeChild(bjsIoLogo.firstChild);
    // }
  }

  // 流程校验使用
  setUrlParam = (name, value) => {

    var url = new URL(window.location.href);

    if (value) {
      url.searchParams.set(name, 1);
    } else {
      url.searchParams.delete(name);
    }

    window.history.replaceState({}, null, url.href);
  }
  // 流程校验使用
  getUrlParam = (name) => {
    var url = new URL(window.location.href);

    return url.searchParams.has(name);
  }


  /**
   * 下载xml/svg
   *  @param  type  类型  svg / xml
   *  @param  data  数据
   *  @param  name  文件名称
   */
  download = (type, data, name) => {
    let dataTrack = '';
    const a = document.createElement('a');

    switch (type) {
      case 'xml':
        dataTrack = 'bpmn';
        break;
      case 'svg':
        dataTrack = 'svg';
        break;
      default:
        break;
    }

    name = name || `diagram.${dataTrack}`;

    a.setAttribute('href', `data:application/bpmn20-xml;charset=UTF-8,${encodeURIComponent(data)}`);
    a.setAttribute('target', '_blank');
    a.setAttribute('dataTrack', `diagram:download-${dataTrack}`);
    a.setAttribute('download', name);

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 导入 xml 文件
  handleOpenFile = e => {
    const that = this;
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      let data = '';
      reader.readAsText(file);
      reader.onload = function(event) {
        data = event.target.result;
        that.renderDiagram(data, 'open');
      };
    }
  };

  // 保存
  handleSave = () => {
    let bpmnXml = '';
    let svgXml = '';
    this.bpmnModeler.saveXML({ format: true }, (err, xml) => {
      console.log(xml);
      bpmnXml = xml;
    });
    this.bpmnModeler.saveSVG({ format: true }, (err, data) => {
      console.log(data);
      svgXml = data;
    });

    // 将bpmnXml和svgXml传给后台
  };

  // 前进
  handleRedo = () => {
    this.bpmnModeler.get('commandStack').redo();
  };

  // 后退
  handleUndo = () => {
    this.bpmnModeler.get('commandStack').undo();
  };

  // 下载 SVG 格式
  handleDownloadSvg = () => {
    this.bpmnModeler.saveSVG({ format: true }, (err, data) => {
      this.download('svg', data);
    });
  };

  // 下载 XML 格式
  handleDownloadXml = () => {
    this.bpmnModeler.saveXML({ format: true }, (err, data) => {
      this.download('xml', data);
    });
  };

  // 流程图放大缩小
  handleZoom = radio => {
    const newScale = !radio
      ? 1.0 // 不输入radio则还原
      : this.state.scale + radio <= 0.2 // 最小缩小倍数
      ? 0.2
      : this.state.scale + radio;

    this.bpmnModeler.get('canvas').zoom(newScale);
    this.setState({
      scale: newScale,
    });
  };

  // 渲染 xml 格式
  renderDiagram = xml => {
    this.bpmnModeler.importXML(xml, err => {
      if (err) {
        console.log(err);
        console.log(xml);
        notification.error({
          message: '提示',
          description: '导入失败',
        });
      }
    });
  };

  // 预览图片
  handlePreview = () => {
    this.bpmnModeler.saveSVG({ format: true }, (err, data) => {
      this.setState({
        svgSrc: data,
        svgVisible: true,
      });
    });
  };

  // 预览XML
  handlePreviewXml = () => {
    this.bpmnModeler.saveXML({ format: true }, (err, data) => {
      console.log(data);
    });
  };

  // 折叠
  handlePanelFold = () => {
    const { hidePanel } = this.state;
    this.setState(
      {
        hidePanel: !hidePanel,
        hideCount: 1,
      },
      () => {},
    );
  };

  // 关闭流程图弹窗
  handleCancel = () => {
    this.setState({
      svgSrc: '',
      svgVisible: false,
    });
  };


  render() {
    const { hidePanel, hideFold, hideCount, svgVisible, svgSrc } = this.state;
    return (
      <div>
        <div
          // bordered={false}
          style={{ width: '100%', height: '600px' }}
          // bodyStyle={{height: '100%'}}
        >
          <div className={styles.container} id="js-drop-zone">
            <div className={styles.canvas} id="canvas" />
            <div
              className={`properties-panel-fold
                                ${hideCount === 1 ? (hidePanel ? 'fold' : '') : ''}
                                ${hideCount === 1 ? (hideFold ? 'hide' : '') : ''}
                            `}
              id="js-panel-fold"
              title="折叠"
              onClick={this.handlePanelFold}
            />
            <div
              className={`properties-panel-parent ${
                hideCount === 1 ? (hidePanel ? 'hidePanel' : 'showPanel') : ''
              }`}
              id="properties-panel"
              style={{ height: '100%' }}
            />
            <EditingTools
              onOpenFIle={this.handleOpenFile}
              // onSave={this.handleSave}
              onUndo={this.handleUndo}
              onRedo={this.handleRedo}
              onDownloadSvg={this.handleDownloadSvg}
              onDownloadXml={this.handleDownloadXml}
              onZoomIn={() => this.handleZoom(0.1)}
              onZoomOut={() => this.handleZoom(-0.1)}
              onZoomReset={() => this.handleZoom()}
              onPreview={this.handlePreview}
              onPreviewXml={this.handlePreviewXml}
            />
          </div>
        </div>

        {/* 查看流程图弹窗 */}
        {svgVisible && (
          <FullModal visible={svgVisible} onCancel={this.handleCancel}>
            <div
              dangerouslySetInnerHTML={{
                __html: svgSrc,
              }}
            />
          </FullModal>
        )}
        
      </div>
    );
  }
}

export default ProcessDesign;
