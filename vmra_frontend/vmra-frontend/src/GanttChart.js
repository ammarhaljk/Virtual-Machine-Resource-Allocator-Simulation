// Importing necessary libraries
import React from 'react';
import './GanttChart.css'; // Add styles for the Gantt chart

const GanttChart = ({ tasks }) => {
  const startTime = Math.min(...tasks.map(task => new Date(task.startTime).getTime()));
  const endTime = Math.max(...tasks.map(task => new Date(task.endTime).getTime()));
  const totalDuration = endTime - startTime;

  // Generate a unique color for each VM
  const getVmColor = (vmId) => {
    const colors = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336"];
    return colors[vmId % colors.length];
  };

  // Get unique VMs from tasks
  const uniqueVms = [...new Set(tasks.map(task => task.vmId))];

  return (
    <div className="gantt-chart">
      <div className="gantt-header">
        <h3>Gantt Chart</h3>
      </div>

      {/* Display VM Names with their colors */}
      <div className="gantt-legend">
        {uniqueVms.map(vmId => (
          <div key={vmId} className="gantt-legend-item">
            <div
              className="gantt-legend-color"
              style={{
                backgroundColor: getVmColor(vmId),
                width: '20px',
                height: '20px',
                display: 'inline-block',
                marginRight: '8px',
                borderRadius: '50%'
              }}
            ></div>
            <span>VM {vmId}</span>
          </div>
        ))}
      </div>

      <div className="gantt-container">
        {tasks.map((task, index) => {
          const taskStart = new Date(task.startTime).getTime();
          const taskEnd = new Date(task.endTime).getTime();
          const leftPosition = ((taskStart - startTime) / totalDuration) * 100;
          const width = ((taskEnd - taskStart) / totalDuration) * 100;

          return (
            <div key={index} className="gantt-row">
              <span className="task-label">{task.taskName} (VM{task.vmId})</span>
              <div
                className="gantt-bar"
                style={{
                  left: `${leftPosition}%`,
                  width: `${width}%`,
                  backgroundColor: getVmColor(task.vmId),
                }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttChart;
