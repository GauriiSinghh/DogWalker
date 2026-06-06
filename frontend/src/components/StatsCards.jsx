import { motion } from "framer-motion";
import { FiCalendar, FiPlusCircle, FiUserCheck, FiCheckCircle } from "react-icons/fi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
};

export default function StatsCards({ bookings }) {
  const total = bookings.length;
  const newCount = bookings.filter((b) => b.status === "New").length;
  const assignedCount = bookings.filter((b) => b.status === "Assigned").length;
  const completedCount = bookings.filter((b) => b.status === "Completed").length;

  const stats = [
    {
      label: "Total Bookings",
      value: total,
      icon: FiCalendar,
      iconClass: "admin-stat-card__icon--total",
    },
    {
      label: "New Bookings",
      value: newCount,
      icon: FiPlusCircle,
      iconClass: "admin-stat-card__icon--new",
    },
    {
      label: "Assigned Bookings",
      value: assignedCount,
      icon: FiUserCheck,
      iconClass: "admin-stat-card__icon--assigned",
    },
    {
      label: "Completed Bookings",
      value: completedCount,
      icon: FiCheckCircle,
      iconClass: "admin-stat-card__icon--completed",
    },
  ];

  return (
    <motion.div
      className="admin-stats"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map(({ label, value, icon: Icon, iconClass }) => (
        <motion.div
          key={label}
          className="admin-stat-card"
          variants={cardVariants}
          whileHover={{ y: -3 }}
        >
          <div className="admin-stat-card__header">
            <p className="admin-stat-card__label">{label}</p>
            <div className={`admin-stat-card__icon ${iconClass}`}>
              <Icon />
            </div>
          </div>
          <p className="admin-stat-card__value">{value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
