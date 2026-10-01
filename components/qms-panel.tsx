import type { ReactNode } from 'react';

type QmsPanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PanelHeader({title,subtitle,action}:{title:string;subtitle?:string;action?:ReactNode}) {
  return <header className="panel-header"><div className="panel-heading"><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</header>;
}

export function QmsPanel({title,subtitle,action,children,className=''}:QmsPanelProps) {
  return <section className={`panel ${className}`}><PanelHeader title={title} subtitle={subtitle} action={action}/>{children}</section>;
}
