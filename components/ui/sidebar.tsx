import React from 'react'

export function Layout({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex h-screen ${className}`} {...props} />
}

export function Sidebar({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <aside className={`w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto ${className}`} {...props} />
  )
}

export function SidebarContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-1 flex-col gap-4 p-4 ${className}`} {...props} />
}

export function SidebarGroup({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-2 ${className}`} {...props} />
}

export function SidebarGroupLabel({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-xs font-semibold text-gray-600 px-2 py-1.5 ${className}`} {...props} />
}

export function SidebarGroupContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-1 ${className}`} {...props} />
}

export function SidebarMenu({ className = '', ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={`space-y-1 list-none ${className}`} {...props} />
}

export function SidebarMenuItem({ className = '', ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={`${className}`} {...props} />
}

export function SidebarMenuButton({
  className = '',
  asChild = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const buttonClassName = `w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-200 transition-colors text-left text-sm font-medium ${className}`

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${buttonClassName} ${children.props.className || ''}`,
      ...props,
    } as any)
  }

  return (
    <button
      className={buttonClassName}
      {...props}
    >
      {children}
    </button>
  )
}
