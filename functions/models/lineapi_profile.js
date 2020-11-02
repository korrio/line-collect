/* jshint indent: 2 */
//sequelize-auto -o "./models" -d rc2_pea -h 167.71.213.91 -u postgres -p 5432 -x postgres -e postgres


module.exports = function(sequelize, DataTypes) {
  return sequelize.define('lineapi_profile', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    line_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    company: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    line_access_token: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'lineapi_profile'
  });
};
