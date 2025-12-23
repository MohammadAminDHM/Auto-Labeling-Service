import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export const CircularStat = ({ title, value, total, icon: Icon, color, link, formatter }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Format display value
  const displayValue = formatter ? formatter(value) : value;
  
  // Determine if this is a dollar value (formatted with $)
  const isDollarValue = formatter && displayValue.toString().includes('$');
  const valueColor = isDollarValue 
    ? (value >= 0 ? 'text-green-500' : 'text-red-500')
    : 'text-foreground';
  
  const CardWrapper = link ? Link : 'div';
  const cardProps = link ? { to: link } : {};
  
  return (
    <CardWrapper {...cardProps} className={link ? "block" : ""}>
      <Card className={`bg-card border-border hover:shadow-lg transition-all duration-300 ${link ? 'cursor-pointer hover:border-primary/50' : ''}`}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              {/* Background circle */}
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={color}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.8s ease',
                    filter: 'drop-shadow(0 0 8px currentColor)'
                  }}
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Icon className={`w-12 h-12 mb-3 ${color}`} />
                <span className={`text-4xl font-bold ${valueColor}`}>{displayValue}</span>
                <span className="text-sm text-muted-foreground mt-1">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <h3 className="text-base font-semibold text-foreground text-center mb-1">{title}</h3>
            {total > 0 && (
              <p className="text-xs text-muted-foreground">
                of {formatter ? formatter(total) : total}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
};