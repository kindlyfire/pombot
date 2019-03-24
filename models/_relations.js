//
// Builds relationships between models
//

module.exports = (db, models) => {
    models.Profile.belongsToMany(models.Pom, { through: models.ProfilePoms })
    models.Profile.belongsToMany(models.Break, {
        through: models.ProfileBreaks
    })

    models.Pom.belongsToMany(models.Profile, { through: models.ProfilePoms })

    models.Break.belongsToMany(models.Profile, {
        through: models.ProfileBreaks
    })
}
