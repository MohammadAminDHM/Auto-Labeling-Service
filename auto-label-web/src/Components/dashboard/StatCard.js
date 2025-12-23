import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export const StatCard = ({ title, value, icon: Icon, color, link }) => {
  const CardWrapper = link ? Link : 'div';
  const cardProps = link ? { to: link } : {};
  
  return (
    <CardWrapper {...cardProps} className={link ? "block" : ""}>
      <Card className={`bg-card border-border ${link ? 'cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
};