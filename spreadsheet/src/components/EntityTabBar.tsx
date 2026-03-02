import React from 'react';
import './EntityTabBar.css';

export interface EntityTab {
  entityId: string;
  name: string;
}

interface EntityTabBarProps {
  entities: EntityTab[];
  activeEntityId: string;
  showCombined: boolean;
  isCombinedActive: boolean;
  onSelectEntity: (entityId: string) => void;
  onSelectCombined: () => void;
}

const EntityTabBar: React.FC<EntityTabBarProps> = ({
  entities,
  activeEntityId,
  showCombined,
  isCombinedActive,
  onSelectEntity,
  onSelectCombined,
}) => {
  return (
    <div className="entity-tab-bar">
      {entities.map(entity => (
        <button
          key={entity.entityId}
          className={`entity-tab ${entity.entityId === activeEntityId && !isCombinedActive ? 'active' : ''}`}
          onClick={() => onSelectEntity(entity.entityId)}
        >
          {entity.name}
        </button>
      ))}
      {showCombined && (
        <button
          className={`entity-tab combined-tab ${isCombinedActive ? 'active' : ''}`}
          onClick={onSelectCombined}
        >
          Combined
        </button>
      )}
    </div>
  );
};

export default EntityTabBar;
