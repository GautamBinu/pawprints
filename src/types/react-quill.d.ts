declare module 'react-quill' {
  import { Component } from 'react';

  export interface QuillOptions {
    modules?: any;
    formats?: string[];
    placeholder?: string;
    theme?: string;
    readOnly?: boolean;
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
  }

  export interface ReactQuillProps extends QuillOptions {
    value?: string;
    defaultValue?: string;
    onChange?: (content: string, delta: any, source: any, editor: any) => void;
    onChangeSelection?: (range: any, source: any, editor: any) => void;
    onFocus?: (range: any, source: any, editor: any) => void;
    onBlur?: (previousRange: any, source: any, editor: any) => void;
    onKeyPress?: (event: any) => void;
    onKeyDown?: (event: any) => void;
    onKeyUp?: (event: any) => void;
    preserveWhitespace?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }

  export default class ReactQuill extends Component<ReactQuillProps> {}
}
