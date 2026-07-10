"use client";

type ElevatorState = {
  visible: boolean;
  moving: boolean;
  from: string;
  to: string;
  counter: string;
  status: string;
  arrived: boolean;
};

export default function Elevator({ elevator }: { elevator: ElevatorState }) {
  return (
    <div id="elevator-overlay" className={`${elevator.visible ? "visible" : ""}${elevator.moving ? " moving" : ""}`}>
      <div className="el-content">
        <div className="el-archive-label">Memory Archive</div>
        <div className="el-floors">
          <div className="el-floor-item">
            <span className="el-floor-label">Current Floor</span>
            <span className="el-floor-num">{elevator.from}</span>
          </div>
          <span className="el-arrow">→</span>
          <div className="el-floor-item">
            <span className="el-floor-label">Destination</span>
            <span className="el-floor-num">{elevator.to}</span>
          </div>
        </div>
        <span className={`${elevator.arrived ? "arrived" : ""}`} id="el-counter">
          {elevator.counter}
        </span>
        <span className={elevator.arrived ? "arrived" : ""} id="el-status">
          {elevator.status}
        </span>
      </div>
    </div>
  );
}
