#include <iomanip>
#include <iostream>

#include <qgsapplication.h>
#include <qgsdistancearea.h>
#include <qgsfeature.h>
#include <qgsgeometry.h>
#include <qgsproject.h>
#include <qgsvectorlayer.h>

// მთელი სამუშაო ცალკე ფუნქციაშია, რომ ფენა და იტერატორი განადგურდეს
// QgsApplication::exitQgis()-მდე (იხ. ახსნა ქვემოთ)
static int measureDistricts() {
    QgsVectorLayer layer("data/imereti_sample.gpkg|layername=municipalities",
                         "municipalities", "ogr");
    if (!layer.isValid()) {
        std::cerr << "Layer failed to load\n";
        return 1;
    }

    // ელიფსოიდური ფართობი: წყარო CRS + ელიფსოიდი
    QgsDistanceArea da;
    da.setSourceCrs(layer.crs(), QgsProject::instance()->transformContext());
    da.setEllipsoid("WGS84");

    std::cout << "Features: " << layer.featureCount() << "\n";

    double planar = 0.0;      // კოორდინატების ერთეულის კვადრატი
    double ellipsoidal = 0.0; // კვადრატული მეტრი
    QgsFeature feature;
    QgsFeatureIterator it = layer.getFeatures();
    while (it.nextFeature(feature)) {
        planar += feature.geometry().area();
        ellipsoidal += da.measureArea(feature.geometry());
    }
    std::cout << std::fixed << std::setprecision(6)
              << "Planar sum: " << planar << " (CRS units^2)\n";
    std::cout << std::setprecision(1)
              << "Ellipsoidal sum: " << ellipsoidal / 1e6 << " km2\n";
    return 0;
}

int main(int argc, char *argv[]) {
    QgsApplication app(argc, argv, false);     // false = GUI არ გვჭირდება
    QgsApplication::setPrefixPath("/usr", true); // QGIS-ის ინსტალაციის საქაღალდე
    QgsApplication::initQgis();

    const int rc = measureDistricts();

    QgsApplication::exitQgis();
    return rc;
}
