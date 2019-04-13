import * as React from "react";
import ReactJson from 'react-json-view';
import { MainModel } from "../models"

export interface RightProps {
  serverResponse: object;
  responseMetrics: string;
}


export function Right(props: RightProps, context?: any) {
  const { handlerInfo, selectedTab, leftArray} = props;
  return (
    <div className="right-half">
      <h2>Server Response</h2>
      <div className="response-display">
        <ReactJson src={props.leftArray[0] ? props.handlerInfo[props.selectedTab].serverResponse : {}} />
      </div>
      <div className="response-metrics">
        {leftArray[0] ? <span className="metrics-time">{`[${handlerInfo[selectedTab].responseMetrics.timeStamp}]`}</span> : ''}
        {leftArray[0] ? <span className="metrics-request">{handlerInfo[selectedTab].responseMetrics.request}</span> : ''}
      </div>
    </div>
  );
}
