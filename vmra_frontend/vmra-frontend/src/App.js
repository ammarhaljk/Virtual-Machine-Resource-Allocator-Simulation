// Importing necessary libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import GanttChart from './GanttChart';

const App = () => {
  const [vms, setVms] = useState([]);
  const [summary, setSummary] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [simulation, setSimulation] = useState([]);
  const [tasks, setTasks] = useState([]); // For storing tasks for Gantt chart

  // Fetch VMs data
  const fetchVms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/vms');
      setVms(response.data);
    } catch (error) {
      console.error('Error fetching VMs:', error);
    }
  };

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch predictions
  const fetchPredictions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/predict');
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  // Allocate resources to a VM
  const allocateResources = async (vmId, cpu, memory) => {
    try {
      await axios.post('http://localhost:5000/allocate', {
        vm_id: vmId,
        cpu: cpu,
        memory: memory,
      });
      fetchVms();
    } catch (error) {
      console.error('Error allocating resources:', error);
    }
  };

  // Apply round-robin scheduling and simulate execution
  const scheduleVms = async () => {
    try {
      const response = await axios.post('http://localhost:5000/schedule');
      fetchVms();

      // Initialize simulation state
      const taskQueue = response.data.vms.map(vm => ({ ...vm, remainingTasks: 5 }));
      setSimulation(taskQueue);

      // Initialize Gantt chart tasks
      const ganttTasks = response.data.vms.map(vm => ({
        id: vm.id,
        name: vm.name,
        tasks: [],
      }));

      const simulateExecution = () => {
        let queueIndex = 0;

        const interval = setInterval(() => {
          setSimulation(prevSimulation => {
            const updatedSimulation = [...prevSimulation];

            // Process one VM at a time in round-robin order
            const currentVM = updatedSimulation[queueIndex];
            if (currentVM.remainingTasks > 0) {
              const startTime = new Date();
              currentVM.remainingTasks -= 1;
              currentVM.cpu_usage = Math.max(currentVM.cpu_usage - 2, 0);
              currentVM.memory_usage = Math.max(currentVM.memory_usage - 128, 0);
              currentVM.status = currentVM.remainingTasks === 0 ? 'Completed' : 'Running';

              // Set CPU and memory to 0 when tasks are completed
              if (currentVM.remainingTasks === 0) {
                currentVM.cpu_usage = 0;
                currentVM.memory_usage = 0;
              }

              // Add task to Gantt chart
              const endTime = new Date(startTime.getTime() + 1000); // 1 second per task
              const ganttTask = {
                vmId: currentVM.id,
                taskName: `Task ${5 - currentVM.remainingTasks}`,
                startTime,
                endTime,
              };
              setTasks(prevTasks => [...prevTasks, ganttTask]);
            }

            queueIndex = (queueIndex + 1) % updatedSimulation.length;

            return updatedSimulation;
          });

          // Check if all tasks are completed
          const allCompleted = simulation.every(vm => vm.remainingTasks === 0);
          if (allCompleted) {
            clearInterval(interval);
          }
        }, 1000); // Execute every second
      };

      simulateExecution();
    } catch (error) {
      console.error('Error scheduling VMs:', error);
    }
  };

  useEffect(() => {
    fetchVms();
    fetchSummary();
    fetchPredictions();
  }, []);

  return (
    <div className="App">
      <h1>Virtual Machine Resource Allocator</h1>
      <div className="summary">
        <h2>Summary</h2>
        <p>Total CPU Usage: {summary.total_cpu_usage}</p>
        <p>Total Memory Usage: {summary.total_memory_usage}</p>
        <p>VM Count: {summary.vm_count}</p>
      </div>

      <div className="vms">
        <h2>Virtual Machines</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>CPU Usage</th>
              <th>Memory Usage</th>
              <th>Status</th>
              <th>Remaining Tasks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {simulation.map(vm => (
              <tr key={vm.id}>
                <td>{vm.id}</td>
                <td>{vm.name}</td>
                <td>{vm.cpu_usage}</td>
                <td>{vm.memory_usage}</td>
                <td>{vm.status}</td>
                <td>{vm.remainingTasks}</td>
                <td>
                  <button
                    onClick={() => allocateResources(vm.id, vm.cpu_usage + 10, vm.memory_usage + 512)}
                    disabled={vm.status === 'Completed'}
                  >
                    Allocate Resources
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gantt">
        <h2>Task Gantt Chart</h2>
        <GanttChart tasks={tasks} />
      </div>

      <div className="actions">
        <button onClick={scheduleVms}>Apply Round-Robin Scheduling</button>
      </div>
    </div>
  );
};

export default App;
