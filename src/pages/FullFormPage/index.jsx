import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReportForm from "../ComunityPage/ReportForm";
import { useAuth } from "../../auth/auth";
import styles from "./FullForm.module.css";

const FullFormPage = () => {
  const location = useLocation();
  const isDemo = location.state?.isDemo || false;
  const { currentUser } = useAuth();

  return (
    <div className={styles.fullFormPage}>
      <ReportForm
        currentUser={currentUser}
        isDemo={isDemo}
        onClose={() => console.log("Form closed")}
        onReportSubmitted={() => console.log("Report submitted")}
        ecoToastError={(msg) => console.error(msg)}
        ecoToastSuccess={(msg) => console.log(msg)}
      />
    </div>
  );
};

export default FullFormPage;
