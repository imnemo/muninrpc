import { action } from "typesafe-actions";
import {
  CallType,
  BaseConfig,
  RequestConfig,
  ClientStreamCbs,
  BidiAndServerStreamCbs,
  GrpcHandlerFactory,
} from "../../lib/local/grpcHandlerFactory";

export namespace mainRequestActions {
  export enum Type {
    HANDLE_UNARY_REQUEST = "HANDLE_UNARY_REQUEST",
    HANDLE_CLIENT_STREAM_START = "HANDLE_CLIENT_STREAM_START",
    HANDLE_SERVER_STREAM_START = "HANDLE_SERVER_STREAM_START",
    HANDLE_BIDI_STREAM_START = "HANDLE_BIDI_STREAM_START",
    SET_GRPC_RESPONSE = "SET_GRPC_RESPONSE",
    HANDLE_SEND_MESSAGE = "HANDLE_SEND_MESSAGE",
    HANDLE_STOP_STREAM = "HANDLE_STOP_STREAM",
    HANDLE_RECIEVE_MESSAGE = "HANDLE_RECIEVE_MESSAGE",
  }

  export const handleSendMessage = () => action(Type.HANDLE_SEND_MESSAGE);
  export const handleRecieveMessage = () => action(Type.HANDLE_RECIEVE_MESSAGE);
  export const handleStopStream = (type?: string) => action(Type.HANDLE_STOP_STREAM, type);
  export const setGRPCResponse = (response: object) => action(Type.SET_GRPC_RESPONSE, response);
  export const handleUnaryRequest = () => (dispatch, getState) => {
    const activeTab = getState().main.activeTab;
    const state = getState().main;

    if (activeTab.requestConfig.callType === CallType.UNARY_CALL) {
      const requestConfig: RequestConfig<void> = {
        ...activeTab.requestConfig,
        argument: activeTab.configArguments.arguments,
      };
      const mergedConfig: BaseConfig & RequestConfig<void> = {
        ...activeTab.baseConfig,
        ...requestConfig,
      };
      const handler = GrpcHandlerFactory.createHandler(mergedConfig);
      state.handlers[state.selectedTab] = handler;
      state.handlerInfo[state.selectedTab].responseMetrics = {
        timeStamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        request: `Request ${activeTab.selectedRequest} sent to ${activeTab.baseConfig.grpcServerURI}`,
      };
      // `${activeTab.selectedRequest} called: [${(new Date()).toLocaleTimeString("en-US", {hour12: false} )}]`;
      handler
        .initiateRequest()
        .then(response => {
          console.log();
          dispatch(
            setGRPCResponse([
              { type: "read", payload: response },
              { type: "write", payload: activeTab.configArguments.arguments },
            ]),
          );
        })
        .catch(error => {
          dispatch(setGRPCResponse(error));
        });
    }
  };

  export const handleClientStreamStart = () => (dispatch, getState) => {
    const activeTab = getState().main.activeTab;
    const state = getState().main;

    if (activeTab.requestConfig.callType === CallType.CLIENT_STREAM) {
      const requestConfig: RequestConfig<ClientStreamCbs> = {
        ...activeTab.requestConfig,
        callbacks: {
          onEndReadCb: res => dispatch(setGRPCResponse(res)),
          onDataWriteCb: res => console.log("client message", res),
        },
        argument: {},
      };
      const mergedConfig: BaseConfig & RequestConfig<ClientStreamCbs> = {
        ...activeTab.baseConfig,
        ...requestConfig,
      };
      const handler = GrpcHandlerFactory.createHandler(mergedConfig);
      handler.initiateRequest();
      state.handlerInfo[state.selectedTab].responseMetrics = {
        timeStamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        request: `${activeTab.selectedRequest} started on ${activeTab.baseConfig.grpcServerURI}`,
      };
      const { writableStream } = handler.returnHandler();
      state.handlers[state.selectedTab] = writableStream;
    }
  };

  export const handleServerStreamStart = () => (dispatch, getState) => {
    const activeTab = getState().main.activeTab;
    const state = getState().main;
    const selectedTab = state.selectedTab;

    if (activeTab.requestConfig.callType === CallType.SERVER_STREAM) {
      const requestConfig: RequestConfig<BidiAndServerStreamCbs> = {
        ...activeTab.requestConfig,
        callbacks: {
          onDataReadCb: res => {
            // console.log('Recieving streamed server data', res)
            dispatch(setGRPCResponse(res));
            dispatch(handleRecieveMessage());
          },
          onEndReadCb: res => {
            dispatch(handleStopStream("server_end"));
          },
        },
        argument: {},
      };
      const mergedConfig: BaseConfig & RequestConfig<BidiAndServerStreamCbs> = {
        ...activeTab.baseConfig,
        ...requestConfig,
      };
      const handler = GrpcHandlerFactory.createHandler(mergedConfig);
      handler.initiateRequest();
      const { readableStream } = handler.returnHandler();
      state.handlers[state.selectedTab] = readableStream;

      state.handlerInfo[state.selectedTab].responseMetrics = {
        timeStamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        request: `${activeTab.selectedRequest} started on ${activeTab.baseConfig.grpcServerURI}`,
      };
    }
  };

  export const handleBidiStreamStart = () => (dispatch, getState) => {
    const activeTab = getState().main.activeTab;
    const state = getState().main;
    const selectedTab = state.selectedTab;

    if (activeTab.requestConfig.callType === CallType.BIDI_STREAM) {
      const requestConfig: RequestConfig<BidiAndServerStreamCbs> = {
        ...activeTab.requestConfig,
        callbacks: {
          onDataReadCb: res => dispatch(setGRPCResponse(res)),
          onDataWriteCb: res => {
            console.log("Writing data from client to server:", res);
          },
          onEndReadCb: () => {
            dispatch(handleStopStream());
          },
        },
        argument: {},
      };
      const mergedConfig: BaseConfig & RequestConfig<BidiAndServerStreamCbs> = {
        ...activeTab.baseConfig,
        ...requestConfig,
      };
      const handler = GrpcHandlerFactory.createHandler(mergedConfig);
      handler.initiateRequest();
      state.handlerInfo[state.selectedTab].responseMetrics = {
        timeStamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        request: `${activeTab.selectedRequest} started on ${activeTab.baseConfig.grpcServerURI}`,
      };
      const { writableStream } = handler.returnHandler();
      state.handlers[state.selectedTab] = writableStream;
    }
  };
}

export type mainRequestActions = Omit<typeof mainRequestActions, "Type">;
