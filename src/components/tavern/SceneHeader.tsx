
import React from 'react';

interface SceneHeaderProps {
  description: string;
}

const SceneHeader: React.FC<SceneHeaderProps> = ({ description }) => {
  return (
    <div className="p-4 bg-tavern-panel-bg rounded-t-lg shadow-md mb-2">
      <h2 className="text-xl font-semibold text-tavern-accent mb-1">The Wandering Wyvern Tavern</h2>
      <p className="text-sm text-tavern-text italic">{description}</p>
    </div>
  );
};

export default SceneHeader;
