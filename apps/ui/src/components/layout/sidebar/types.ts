import type { Project } from '@/lib/electron';
import type React from 'react';

export type NavTo =
  | '/'
  | '/agent'
  | '/board'
  | '/context'
  | '/github-issues'
  | '/github-prs'
  | '/interview'
  | '/profiles'
  | '/running-agents'
  | '/settings'
  | '/setup'
  | '/spec'
  | '/terminal'
  | '/wiki';

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export interface NavItem {
  id: string;
  to: NavTo;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  /** Optional count badge to display next to the nav item */
  count?: number;
}

export interface SortableProjectItemProps {
  project: Project;
  currentProjectId: string | undefined;
  isHighlighted: boolean;
  onSelect: (project: Project) => void;
}

export interface ThemeMenuItemProps {
  option: {
    value: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
  };
  onPreviewEnter: (value: string) => void;
  onPreviewLeave: (e: React.PointerEvent) => void;
}
