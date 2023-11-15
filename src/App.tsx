import React from 'react';
import './App.css';

function App() {
  const context = require.context('./posts', false, /\.tsx$/) ;
  console.log("context is ");
  console.log(context);
  // const posts: React.ComponentType[] = context.keys().map(context) as React.ComponentType[];
  const posts: React.ComponentType[] = context.keys().map(key => context(key).default as React.ComponentType);


  console.log("posts is");
  console.log(posts);

  return (
    <div className="App">
      <div>
      <h1>Hello World Blog</h1>
      {posts.map((PostComponent: React.ComponentType, index) => (
        <div key={index}>
          <PostComponent />
        </div>
      ))}
    </div>
    </div>
  );
}

export default App;
