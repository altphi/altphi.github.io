import React from 'react';
import marked from 'marked';

type MarkdownProps = {
  content: string;
};

const MarkdownComponent: React.FC<MarkdownProps> = ({ content }) => {
  const createMarkup = () => {
    return { __html: marked.parse(content) };
  };

  return <div dangerouslySetInnerHTML={createMarkup()} />;
};

export default MarkdownComponent;
