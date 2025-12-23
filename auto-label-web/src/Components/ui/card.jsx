export function Card({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div>{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}

export function CardTitle({ children }) {
  return <h3>{children}</h3>;
}
