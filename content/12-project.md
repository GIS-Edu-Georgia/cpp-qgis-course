---
n: 12
title: პროექტი: საკუთარი ინსტრუმენტი QGIS-ში
en: Capstone — your own tool inside QGIS
eyebrow: პრაქტიკა
topics: დამოუკიდებელი C++ აპლიკაცია · CRS და ფართობი · CMake · C++ პლაგინის სტრუქტურა · QGIS-ის აწყობა · ლიცენზია
---

საბოლოო მიზანი: საკუთარი C++ კოდი QGIS-თან ერთად გაუშვა. გზა სამ საფეხურად ვაგებთ: ჯერ ვმუშაობთ QGIS-ის ბიბლიოთეკასთან დამოუკიდებელ აპლიკაციაში, შემდეგ ვაკეთებთ პლაგინის სტრუქტურას, ბოლოს (არასავალდებულოდ) ვაწყობთ QGIS-ს წყაროდან.

ამ თავში შემოდის ახალი ტერმინები: **პლაგინი** არის დამატება, რომელსაც QGIS ჩატვირთვისას აკავშირებს თავის მენიუსა და ფუნქციებთან; C++ პლაგინი არის **დინამიური ბიბლიოთეკა** (`.dll` Windows-ზე, `.so` Linux-ზე) — ცალკე ფაილი, რომელიც უშუალოდ კი არ იხსნება, არამედ სხვა პროგრამა (QGIS) ტვირთავს. **CMake** კი არის „აწყობის დირიჟორი“: ტექსტური ფაილი (`CMakeLists.txt`), რომელიც ეუბნება, რომელი ფაილები და ბიბლიოთეკები დააკომპილოს და როგორ დააკავშიროს.

::: warn გაიგე, რა არის და რა არ არის შემოწმებული
**საფეხური 1** (დამოუკიდებელი პროგრამა, CMake) რეალურად აწყობილი და გაშვებულია: Linux Mint 22.3 (Ubuntu 24.04), g++ 13.3, CMake 3.28, QGIS 3.44.15 (`libqgis-dev`), Qt5. **საფეხური 2** (პლაგინი) შედგენილია QGIS-ის რეალური წყაროს (`src/plugins/topology`) მიხედვით, მაგრამ ავტორს ის ჯერ არ აუწყვია და არ გაუშვია, ხოლო საფეხური 3 (QGIS-ის აწყობა) მხოლოდ მიმოხილვაა. გამოიყენე ისინი როგორც გზამკვლევი: სისტემის ბილიკები და ვერსიები მოარგე შენს ინსტალაციას. API-ის ხელმოწერები შემოწმებულია `api.qgis.org`-ის 4.3.0-Master დოკუმენტაციასთან; QGIS 3.x-ში ზოგი overload შეიძლება განსხვავდებოდეს.
:::

## გეგმა

| საფეხური | შედეგი | სირთულე |
|---|---|---|
| 1 | კონსოლური პროგრამა, რომელიც `qgis_core`-ს იყენებს და პოლიგონების ფართობს ითვლის | დაბალი |
| 2 | C++ პლაგინის სტრუქტურა: რა ფაილებისგან შედგება და როგორ ერთვება QGIS-ში | საშუალო |
| 3 | QGIS-ის აწყობა წყარო კოდიდან (გაფართოებული, არასავალდებულო) | მაღალი |

::: tip რჩევა
ბევრი პირდაპირ მესამე საფეხურზე ხტება და აწყობის დეტალებში იჭედება. პირველი ორი უკვე გასაგებ შედეგს იძლევა და გასწავლის ბიბლიოთეკების ერთად მუშაობას.
:::

## CRS და ფართობი: ჯერ ეს უნდა გავიგოთ

ფართობის გამოთვლა მხოლოდ ფორმულა არ არის. **CRS** (კოორდინატთა სისტემა) განსაზღვრავს, რას ნიშნავს კოორდინატის რიცხვი: გრადუსს თუ მეტრს. `QgsGeometry::area()` ითვლის **გეგმურ (დეკარტულ) ფართობს** კოორდინატების ერთეულებში. თუ მონაცემები გეოგრაფიულ CRS-შია (მაგალითად, WGS 84, გრადუსებში), შედეგი **კვადრატული გრადუსია** და კვადრატულ მეტრებად ვერ ჩაითვლება.

| გზა | როდის | შედეგის ერთეული |
|---|---|---|
| `geometry().area()` | მონაცემები უკვე საპროექციო CRS-შია (მეტრებში, მაგ. UTM) | CRS-ის ერთეულის კვადრატი |
| `QgsDistanceArea::measureArea(...)` | ზუსტი ელიფსოიდური გამოთვლა, ნებისმიერი CRS-ისთვის | დამოკიდებულია `areaUnits()`-ზე (ელიფსოიდის გამოყენებისას კვადრატული მეტრი) |
| გადაპროექტება `QgsCoordinateTransform`-ით | გვინდა გეომეტრია სხვა CRS-ში | ახალი CRS-ის ერთეული |

::: analogy რუკა და მასშტაბი
რუკაზე „5 სანტიმეტრი“ არაფერს ნიშნავს, სანამ მასშტაბი არ ვიცით. კოორდინატის რიცხვიც ასეა: მნიშვნელობა მხოლოდ CRS-ით მიიღება.
:::

## მონაცემები: იმერეთის ნიმუში (OpenStreetMap)

წიგნის მაგალითებისთვის მზა ღია მონაცემია `data/imereti_sample.gpkg` (დაახლოებით 2 MB) რეპოზიტორიაში. ეს OpenStreetMap-ის იმერეთის ამონარიდია Geofabrik-ის საქართველოს ნაკრებიდან (2026-10-19), EPSG:4326 კოორდინატებში.

| ფენა | გეომეტრია | ობიექტები | შინაარსი |
|---|---|---|---|
| `municipalities` | პოლიგონი | 12 | იმერეთის მუნიციპალიტეტები და ქუთაისი (`name`, `osm_id`) |
| `places` | წერტილი | 518 | ქალაქები და სოფლები (`fclass`: `city`, `town`, `village`) |
| `roads` | ხაზი | 1956 | მთავარი გზები (`fclass`: `motorway`, `trunk`, `primary`, `secondary`) |
| `rivers` | ხაზი | 380 | მდინარეები |

::: note მონაცემთა წყარო და ლიცენზია
მონაცემები: © OpenStreetMap contributors, ლიცენზია **ODbL 1.0** (`openstreetmap.org/copyright`). დამუშავება: Geofabrik GmbH, ამონარიდი: ამ წიგნის ავტორი. ODbL მოითხოვს წყაროს მითითებას და იმავე ლიცენზიით გავრცელებას ამ მონაცემებზე დაფუძნებული ბაზებისა; ამიტომ `data/` საქაღალდე ცალკე `NOTICE` ფაილითაა და წიგნის ტექსტის ლიცენზიისგან გამოყოფილია. სრული, ყოველდღე განახლებადი ნაკრები: `download.geofabrik.de/europe/georgia.html` (`georgia-latest-free.shp.zip`). მისი რიცხვები ჩვენი ნიმუშისგან განსხვავდება.
:::

## საფეხური 1: პოლიგონების ფართობი `qgis_core`-ზე

ამოცანა: იმერეთის მუნიციპალიტეტების ფენის ჩატვირთვა, ობიექტების დათვლა და ფართობების ჯამის გამოთვლა ორი გზით: გეგმურად და ელიფსოიდურად.

```cpp main.cpp
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
```

გამოსავალი იმერეთის ნიმუშზე (`data/imereti_sample.gpkg`):

```output
Features: 12
Planar sum: 0.696446 (CRS units^2)
Ellipsoidal sum: 6391.6 km2
```

ფენა გეოგრაფიულ CRS-შია (EPSG:4326), ამიტომ პირველი რიცხვი **კვადრატული გრადუსია** (0.696446) და კვადრატულ მეტრებად არ ითვლება, მეორე კი ელიფსოიდზე გამოთვლილი ნამდვილი ფართობია: დაახლოებით 6392 კმ². სწორედ ამიტომ ორივეს ერთად ვბეჭდავთ. `da.areaUnits()` ამ შემთხვევაში კვადრატულ მეტრს აბრუნებს (`Qgis::AreaUnit::SquareMeters`), ამიტომ `1e6`-ზე გაყოფა კვადრატულ კილომეტრს გვაძლევს.

::: note როგორ არის შემოწმებული ეს რიცხვები
ეს პროგრამა აწყობილია და გაშვებულია Linux Mint 22.3-ზე (g++ 13.3, QGIS 3.44.15, Qt5) და ზუსტად ეს სამი სტრიქონი დაბეჭდა. იგივე რიცხვები მივიღეთ PyQGIS-ითაც QGIS 4.2.2-ში, ანუ შედეგი QGIS-ის ორ სხვადასხვა ვერსიაში ერთნაირია. შენს კომპიუტერზე უნდა მიიღო იგივე სამი მნიშვნელობა: `12`, `0.696446`, `6391.6`.
:::

::: warn ორი რეალური ხაფანგი, რომელიც ამ მაგალითზე აღმოვაჩინეთ
**1. განადგურების თანმიმდევრობა.** თავიდან ფენა `main`-ში ეწერა და `exitQgis()` მის შემდეგ ისე გამოიძახებოდა, რომ ფენა მხოლოდ `main`-ის ბოლოს (`exitQgis()`-ის **შემდეგ**) განადგურდებოდა. მაშინ მას გასუფთავებული GDAL ბიბლიოთეკა დახვდებოდა და პროგრამა `Segmentation fault`-ით ჩამოვარდებოდა, ისე რომ ეკრანზე არაფერი დაიბეჭდებოდა (გამოსავალი ბუფერშივე რჩებოდა). გამოსავალი: მთელი სამუშაო ცალკე ფუნქციაშია (`measureDistricts`), რომ ფენა, იტერატორი და `QgsDistanceArea` დასრულდეს `exitQgis()`-მდე. ეს თავი 08-ის წესის კონკრეტული შემთხვევაა: ობიექტების სიცოცხლე და განადგურების თანმიმდევრობა.

**2. ეკრანის გარეშე გაშვება.** თუ პროგრამას გრაფიკული ეკრანის გარეშე (მაგ. SSH-ით ან სერვერზე) გაუშვებ, Qt შეიძლება დაგიბეჭდოს `could not connect to display`. გაუშვი ასე: `QT_QPA_PLATFORM=offscreen ./district_area`.
:::

::: warn Windows-ზე
Windows-ის სტანდარტულ QGIS ინსტალერში (მაგ. QGIS 4.2.2) `qgis_core`-ისთვის header-ები და `.lib` ფაილები არ შედის: საქაღალდეში `apps/qgis` არ არის `include` და `lib`. C++ პროექტის ასაწყობად Windows-ზე გჭირდება OSGeo4W-ის დეველოპერული პაკეტები ან QGIS-ის აწყობა წყაროდან. უმარტივესი გზა Linux-ზეა (`libqgis-dev`), ამიტომ ეს თავი ასეთ გარემოზეა დაწერილი.
:::

ხაზ-ხაზ:

| კოდი | რას აკეთებს |
|---|---|
| `#include <qgs...h>` | ვრთავთ QGIS-ის კლასებს (header ფაილები, თავი 03) |
| `int main(int argc, char *argv[])` | `main`-ის ვერსია, რომელიც ბრძანების ხაზის არგუმენტებს იღებს (Qt მათ ითხოვს) |
| `QgsApplication app(argc, argv, false);` | QGIS-ის „გარემოს“ ობიექტი; `false` ნიშნავს, რომ გრაფიკული ინტერფეისი არ გვჭირდება (headless, ქვეთავი 1.4) |
| `QgsApplication::setPrefixPath("/usr", true);` | ვეუბნებით, სად დგას QGIS (პლაგინები, რესურსები); Linux-ზე სისტემური ინსტალაციისას ჩვეულებრივ `/usr` |
| `QgsApplication::initQgis();` | QGIS-ის ინიციალიზაცია (static მეთოდია: კლასიდან გამოიძახება); ამზადებს მონაცემთა პროვაიდერებს, CRS ბაზას და სხვას |
| `QgsVectorLayer layer("districts.geojson", "districts", "ogr");` | ვქმნით ფენას: ფაილი, სახელი, მონაცემთა პროვაიდერი (`ogr` კითხულობს ბევრ ფორმატს) |
| `if (!layer.isValid())` | თუ ფენა ვერ ჩაიტვირთა, ვბეჭდავთ შეცდომას `std::cerr`-ით და ვასრულებთ პროგრამას კოდით `1` |
| `QgsDistanceArea da; da.setSourceCrs(...); da.setEllipsoid("WGS84");` | ზუსტი გაზომვის ობიექტი: ვუთითებთ ფენის CRS-ს და ელიფსოიდს |
| `da.measureArea(geometry)` | გეომეტრიის ფართობი ელიფსოიდზე |
| `while (it.nextFeature(feature))` | ციკლი ობიექტებზე (თავი 11) |
| `QgsApplication::exitQgis();` | გამართულად ვასრულებთ მუშაობას და ვათავისუფლებთ რესურსებს |

::: note
`setPrefixPath` ბილიკი სისტემაზეა დამოკიდებული: Linux-ის პაკეტიდან დაყენებისას ჩვეულებრივ `/usr`, ხელით აწყობისას — `--prefix`-ის მნიშვნელობა, Windows-ზე (OSGeo4W) — QGIS-ის საქაღალდე. თუ ბილიკი არასწორია, ფენა `isValid() == false` დაგიბრუნებს.
:::

## CMake: ერთი კონკრეტული გარემო

ქვემოთ მაგალითი **Ubuntu/Debian-ისთვისაა** (Linux Mint-ზეც იგივე ბრძანებები მუშაობს), სადაც QGIS 3.x და Qt5 სისტემური პაკეტებით დგას.

::: warn Flatpak QGIS არ გამოდგება
თუ QGIS Flatpak-ით გაქვს დაყენებული, მისი header-ები და ბიბლიოთეკები C++ აწყობისთვის მიუწვდომელია: Flatpak პროგრამას იზოლირებულ გარემოში ინახავს. აწყობისთვის დააყენე სისტემური პაკეტები (`libqgis-dev`, ქვემოთ), რომლებიც Flatpak-ს არ ეწინააღმდეგება. ორივე ერთად შეიძლება იდგეს. შედეგის გრაფიკულად შესამოწმებლად Flatpak QGIS ისევ გამოგადგება.
::: QGIS 4-სთვის გამოიყენება Qt6, ამიტომ `Qt5` უნდა შეიცვალოს `Qt6`-ით. სხვა სისტემებზე ბილიკები და პაკეტების სახელები განსხვავდება.

დამოკიდებულებების დაყენება:

```bash
sudo apt install build-essential cmake qgis libqgis-dev qtbase5-dev
```

`CMakeLists.txt`:

```cmake CMakeLists.txt
cmake_minimum_required(VERSION 3.16)
project(district_area LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# QGIS 3.x = Qt5. QGIS 4 = Qt6: შეცვალე Qt5 -> Qt6.
find_package(Qt5 REQUIRED COMPONENTS Core Gui Xml Widgets)

find_path(QGIS_INCLUDE_DIR qgsapplication.h PATH_SUFFIXES qgis)
find_library(QGIS_CORE_LIBRARY qgis_core)

if(NOT QGIS_INCLUDE_DIR OR NOT QGIS_CORE_LIBRARY)
  message(FATAL_ERROR "QGIS headers or qgis_core not found")
endif()

add_executable(district_area main.cpp)
target_include_directories(district_area PRIVATE ${QGIS_INCLUDE_DIR})
target_link_libraries(district_area PRIVATE
    ${QGIS_CORE_LIBRARY} Qt5::Core Qt5::Gui Qt5::Xml Qt5::Widgets)
```

ფაილის ნაწილები: `project(...)` აძლევს პროექტს სახელს; `find_package`, `find_path`, `find_library` ეძებენ საჭირო ბიბლიოთეკებს სისტემაში (პირობა `if(NOT ...)` გვაჩერებს, თუ ვერაფერი იპოვა); `add_executable` ამბობს, რომ ვაწყობთ პროგრამას `main.cpp`-დან; `target_link_libraries` აკავშირებს მას QGIS-სა და Qt-თან.

```bash
cmake -S . -B build
cmake --build build
cd /path/to/data      # საქაღალდე, სადაც districts.geojson დევს
/path/to/build/district_area
```

პირველი ბრძანება ამზადებს აწყობას `build` საქაღალდეში, მეორე აკომპილებს და აკავშირებს (compile + link), მესამე უშვებს შედეგს. პროგრამა `districts.geojson`-ს ეძებს იმ საქაღალდეში, საიდანაც გაუშვი (ან მიუთითე სრული გზა კოდში).

### ტიპური შეცდომები და მათი გამოსწორება

| შეცდომა | მიზეზი | რა გააკეთო |
|---|---|---|
| `qgsapplication.h: No such file or directory` | კომპილატორმა QGIS-ის header-ები ვერ იპოვა | დააყენე `libqgis-dev` და შეამოწმე `QGIS_INCLUDE_DIR` |
| `undefined reference to QgsApplication::...` | `qgis_core` არ არის მიბმული | შეამოწმე `target_link_libraries` |
| `libqgis_core.so.3.xx: cannot open shared object file` | გაშვებისას ბიბლიოთეკა ვერ მოიძებნა | დაამატე ბილიკი `LD_LIBRARY_PATH`-ში ან `RPATH`-ში |
| `Layer failed to load` | არასწორი ფაილის გზა ან `setPrefixPath` | შეამოწმე ფაილის გზა და `setPrefixPath`-ის მნიშვნელობა |
| Qt5/Qt6 შეუსაბამობა | პროგრამა სხვა Qt ვერსიით აიწყო, ვიდრე QGIS | გამოიყენე ის Qt, რომელზეც QGIS არის აწყობილი |

## საფეხური 2: C++ პლაგინი QGIS-ის წყაროში

C++ პლაგინი არის დინამიური ბიბლიოთეკა, რომელსაც QGIS გაშვებისას ტვირთავს. QGIS-ის რეპოზიტორიაში უკვე არსებობს რეალური C++ პლაგინები (`src/plugins/topology`, `geometry_checker`, `offline_editing`). საუკეთესო სასწავლო გზაა მათი სტრუქტურის გამეორება. ქვემოთ მინიმალური პლაგინია, აგებული `topology`-ს მიხედვით.

**პლაგინის სავალდებულო ნაწილები** (QGIS-ის `qgisplugin.h`-იდან):

1. კლასი, რომელიც მემკვიდრეობს `QgisPlugin`-იდან და ახორციელებს `initGui()` და `unload()` მეთოდებს;
2. `extern "C"` ფუნქციები: `classFactory`, `name`, `description`, `category`, `type`, `version`, `icon`, `unload`. QGIS მათ პლაგინის ბიბლიოთეკიდან ეძახის სახელით, ამიტომ ისინი C++-ის სახელების გადაკეთების (name mangling) გარეშე უნდა გამოჩნდეს; ამას მაკრო `QGISEXTERN` აკეთებს;
3. `CMakeLists.txt`, რომელიც `MODULE` ტიპის ბიბლიოთეკას ქმნის.

```cpp mytool.h
#ifndef MYTOOL_H
#define MYTOOL_H

#include <QObject>
#include "../qgisplugin.h"

class QAction;
class QgisInterface;

class MyTool : public QObject, public QgisPlugin {
    Q_OBJECT
public:
    explicit MyTool(QgisInterface *iface);

public slots:
    void initGui() override;    // QGIS გვიძახებს ჩატვირთვისას
    void unload() override;     // და გამორთვისას
    void run();                 // მენიუს პუნქტის დაჭერისას

private:
    QgisInterface *mIface = nullptr;
    QAction *mAction = nullptr;
};

#endif
```

```cpp mytool.cpp
#include "qgisinterface.h"
#include "qgsapplication.h"
#include "qgsmaplayer.h"
#include "qgsvectorlayer.h"

#include <QAction>
#include <QMessageBox>
#include <QString>

#include "mytool.h"
#include "moc_mytool.cpp"

static const QString sName = QObject::tr("Feature Counter");
static const QString sDescription = QObject::tr("Counts features of the active vector layer");
static const QString sCategory = QObject::tr("Vector");
static const QString sPluginVersion = QObject::tr("Version 0.1");
static const QgisPlugin::PluginType sPluginType = QgisPlugin::UI;
static const QString sPluginIcon = QString();

MyTool::MyTool(QgisInterface *iface)
    : QgisPlugin(sName, sDescription, sCategory, sPluginVersion, sPluginType),
      mIface(iface) {}

void MyTool::initGui() {
    delete mAction;
    mAction = new QAction(sName, this);
    connect(mAction, &QAction::triggered, this, &MyTool::run);
    mIface->addPluginToMenu(tr("&My Tools"), mAction);
}

void MyTool::unload() {
    mIface->removePluginMenu(tr("&My Tools"), mAction);
    delete mAction;
    mAction = nullptr;
}

void MyTool::run() {
    auto *layer = qobject_cast<QgsVectorLayer *>(mIface->activeLayer());
    if (!layer) {
        QMessageBox::warning(nullptr, tr("Error"), tr("Select a vector layer."));
        return;
    }
    QMessageBox::information(nullptr, tr("Result"),
        tr("Features: %1").arg(layer->featureCount()));
}

// ---- სავალდებულო ექსპორტირებული ფუნქციები ----
QGISEXTERN QgisPlugin *classFactory(QgisInterface *iface) { return new MyTool(iface); }
QGISEXTERN const QString *name() { return &sName; }
QGISEXTERN const QString *description() { return &sDescription; }
QGISEXTERN int type() { return sPluginType; }
QGISEXTERN const QString *category() { return &sCategory; }
QGISEXTERN const QString *version() { return &sPluginVersion; }
QGISEXTERN const QString *icon() { return &sPluginIcon; }
QGISEXTERN void unload(QgisPlugin *plugin) { delete plugin; }
```

```cmake CMakeLists.txt
set(mytool_SRCS mytool.cpp)

add_library(plugin_mytool MODULE ${mytool_SRCS})

include_directories(
  ${CMAKE_SOURCE_DIR}/src/plugins
  ${CMAKE_BINARY_DIR}/src/ui
  ${CMAKE_CURRENT_BINARY_DIR}
)

target_link_libraries(plugin_mytool qgis_core qgis_gui)

install(TARGETS plugin_mytool
  RUNTIME DESTINATION ${QGIS_PLUGIN_DIR}
  LIBRARY DESTINATION ${QGIS_PLUGIN_DIR})
```

ფაილები `mytool/` საქაღალდეში უნდა დაიდოს QGIS-ის წყაროში `src/plugins/mytool/`, ხოლო `src/plugins/CMakeLists.txt`-ში უნდა დაემატოს ხაზი `add_subdirectory(mytool)` (იქ ახლა წერია `add_subdirectory(topology)`, `add_subdirectory(geometry_checker)` და სხვა). შემდეგ QGIS-ის აწყობა (საფეხური 3) შენს პლაგინსაც ააგებს.

ხაზ-ხაზ: `class MyTool : public QObject, public QgisPlugin` — მემკვიდრეობა `QObject`-იდან (signal/slot-ისთვის) და `QgisPlugin`-იდან (პლაგინის ინტერფეისი). `Q_OBJECT` არის Qt-ის მაკრო, რომელიც signal/slot მექანიზმს რთავს. `initGui()` QGIS-ს ჩატვირთვისას ეძახის: აქ ვქმნით მენიუს პუნქტს (`QAction`) და ვაკავშირებთ `run()` მეთოდთან. `unload()` გამორთვისას ასუფთავებს. `run()` კი ინსტრუმენტის ლოგიკაა: იღებს აქტიურ ფენას, ამოწმებს, რომ ვექტორულია, და შეტყობინებით აჩვენებს ობიექტების რაოდენობას. `iface` (`QgisInterface`) QGIS-ის ფანჯრასთან ურთიერთობის შესასვლელია. `tr("...")` აღნიშნავს ტექსტს, რომლის თარგმნაც მომავალში იქნება შესაძლებელი.

::: note QGIS-ის წყაროს ჩვევები
`#include "moc_mytool.cpp"` ბოლოს და `../qgisplugin.h` იმ კონვენციებს მიჰყვება, რომელსაც `src/plugins/topology/topol.cpp` იყენებს. თუ შენს QGIS ვერსიაში აწყობა სხვა ფორმას მოითხოვს, პირდაპირ `topology` პლაგინს შეადარე: ის ყოველთვის სწორია ამ ვერსიისთვის.
:::

## საფეხური 3: QGIS-ის აწყობა წყაროდან (გაფართოებული)

ეს საფეხური არ არის აუცილებელი წიგნის ძირითადი შედეგისთვის. QGIS-ის აწყობა სერიოზული ამოცანაა: მოითხოვს დამოკიდებულებებს (Qt, GDAL, GEOS, PROJ და სხვა), მნიშვნელოვან დროსა და ადგილს დისკზე. დაიწყე მხოლოდ მაშინ, როცა პირველი ორი საფეხური უკვე მუშაობს.

```bash
git clone https://github.com/qgis/QGIS.git
cd QGIS
mkdir build && cd build
cmake -G Ninja -DCMAKE_BUILD_TYPE=Debug ..
ninja
```

| ეტაპი | რა ხდება |
|---|---|
| `cmake` | ამოწმებს დამოკიდებულებებს და ქმნის build ფაილებს; დამოკიდებულებების სრული სია QGIS-ის `INSTALL.md`-შია |
| `ninja` | აკომპილებს; პირველად დიდ დროს მოითხოვს |
| ტესტი | გაუშვი აწყობილი `qgis`; პლაგინი ჩატვირთე „Plugin Manager“-იდან |

მცირე ცვლილების შეტანის შემდეგ `ninja` მხოლოდ შეცვლილ ფაილებს აკომპილებს.

::: warn ლიცენზია
QGIS ვრცელდება GNU GPL ლიცენზიით. ამ ლიცენზიის მოთხოვნები (მათ შორის წყარო კოდის გადაცემის ვალდებულება) დამოკიდებულია იმაზე, **როგორ და ვისთვის** ავრცელებ პროგრამას, ხოლო კონკრეტული შემთხვევა შეიძლება გარემოებებზე იყოს დამოკიდებული. ეს ტექსტი იურიდიული რჩევა არ არის. თუ გეგმავ საკუთარი კოდის გავრცელებას QGIS-თან ერთად ან მასში ჩაშენებულს, წაიკითხე ლიცენზიის პირობები და საჭიროებისას მიმართე იურისტს. გაითვალისწინე ისიც, რომ კომპილირებული ბინარული კოდის დაცვა აბსოლუტური არ არის: მისი უკუინჟინერია რთულია, მაგრამ შესაძლებელია.
:::

## სავარჯიშო და შეჯამება

::: exercise საბოლოო დავალება
1. გააკეთე საფეხური 1 `data/imereti_sample.gpkg`-ზე. **მოსალოდნელი შედეგი:** `Features: 12`, `Planar sum: 0.696446`, `Ellipsoidal sum: 6391.6 km2`.
2. გამოიტანე თითოეული მუნიციპალიტეტის ფართობი კმ²-ში. **მოსალოდნელი შედეგი:** ყველაზე დიდი ხარაგაულია (≈ 905 კმ²), ყველაზე პატარა ქუთაისი (≈ 59 კმ²).
3. გახსენი იგივე ფაილი QGIS-ში და შეადარე შენი შედეგი ატრიბუტთა ცხრილის გამოსახულებას `$area` (ელიფსოიდზე) / `area($geometry)` (გეგმური).
4. გახსენი ფენა `places` და `QgsFeatureRequest`-ის ფილტრით დათვალე მხოლოდ ქალაქები (`"fclass" = 'town'`). **მოსალოდნელი შედეგი:** 11 ქალაქი და 1 `city` (ქუთაისი); სულ 518 ობიექტი.
4. წაიკითხე `src/plugins/topology/topol.cpp` და იპოვე იქ ყველა `QGISEXTERN` ფუნქცია. **შემოწმება:** ჩამოწერე რვავე სახელი.
5. მოამზადე 5-ხაზიანი დოკუმენტი: რა ისწავლე, რა გაუგებარია, რა გინდა შემდეგ ეტაპზე.
:::

::: summary კურსის შეჯამება
- PyQGIS და C++ API ერთი ბირთვის ორი ინტერფეისია; სახელები უმეტესად ერთია, ზუსტი ხელმოწერები კი ყოველთვის უნდა გადაამოწმო.
- `*` — შეიძლება `nullptr`, `&` — აუცილებლად არსებობს, `const &` — უსაფრთხო წაკითხვა.
- smart pointer-ები და QObject-ის ხე მეხსიერებას თავად მართავენ, მაგრამ QGIS-ს საკუთარი მფლობელობის წესები აქვს.
- `QgsGeometry::area()` გეგმურია; გეოგრაფიული ფართობისთვის `QgsDistanceArea`.
- `api.qgis.org` იკითხება: აღწერა, ტიპები, ხელმოწერა.
- გზა: დამოუკიდებელი აპლიკაცია → პლაგინის სტრუქტურა → QGIS-ის აწყობა.
:::

## დასასრულის ნაცვლად

წიგნში გავლილი გზა C++-ის ძირითადი ცნებებიდან QGIS Core-ის API-მდე გაძლევს საფუძველს, რომ უფრო ღრმად გაიგო QGIS-ის პროგრამული გარემო. თუმცა პროგრამირების სწავლა მხოლოდ ცნებებისა და მაგალითების გაცნობით არ სრულდება: ცოდნა მაშინ მტკიცდება, როცა თავად იკვლევ დოკუმენტაციას, კითხულობ არსებულ კოდს, ცდი სხვადასხვა მიდგომას და საკუთარ ამოცანას პროგრამულ გადაწყვეტად აქცევ.

### როგორ გააგრძელო დამოუკიდებლად

1. **იმუშავე `api.qgis.org`-ზე.** აიღე ნებისმიერი კლასი, რომელიც ამ წიგნში არ გვქონია (მაგ. `QgsCoordinateTransform`, `QgsFeatureRequest`), და წაიკითხე ის თავი 11-ის მეთოდით: აღწერა, ხელმოწერები, `#include`, ბიბლიოთეკა.
2. **წაიკითხე რეალური კოდი.** QGIS-ის წყაროში (`src/plugins/`, `src/core/`) არსებული კოდი საუკეთესო სახელმძღვანელოა. დაიწყე პატარა პლაგინით (`topology`) და მისი სტრუქტურა შეადარე შენს ჩონჩხს.
3. **დაიწყე ამოცანიდან.** აირჩიე შენი რეალური, პატარა GIS ამოცანა და მოაგვარე ის `qgis_core`-ზე დაფუძნებული პროგრამით, მაგალითად ფენის ობიექტების გაფილტვრა და შედეგის შენახვა.
4. **იკითხე და გაიზიარე.** QGIS-ის დეველოპერთა საზოგადოება ღიაა: შეგიძლია მიაკითხო GitHub-ზე არსებულ „good first issue“-ებს და თანდათან მიიღო მონაწილეობა.

### შემდეგი ნაბიჯები

- გამოცადე და გააუმჯობესე საფეხური 1-ის პროგრამა: დაამატე ფილტრები, CRS-ების გადაყვანა, შედეგის ჩაწერა ახალ ფაილში;
- გადააქციე პლაგინის ჩონჩხი სრულფასოვან ინსტრუმენტად: დიალოგი, პარამეტრები, პროგრესის ჩვენება;
- შეისწავლე QGIS-ის პროცესინგის ჩარჩო (processing framework) და დაწერე საკუთარი ალგორითმი;
- თუ საჭიროა, გადადი უფრო რთულ თემებზე: ტესტირება (unit tests), მრავალნაკადიანი დამუშავება, სხვა პროვაიდერები.

ამ წიგნის მიზანი არ ყოფილა QGIS-ის ყველა კომპონენტის ამომწურავი აღწერა. მისი მიზანი იყო მკითხველისთვის იმ ცოდნისა და მიდგომის შეთავაზება, რომელიც დამოუკიდებელი შესწავლისა და პრაქტიკული განვითარების გაგრძელებაში დაეხმარება.

ყოველი ახალი პროგრამული ინსტრუმენტი იწყება კონკრეტული ამოცანით, ხოლო მისი გაუმჯობესება — იმის გააზრებით, თუ როგორ მუშაობს ის შიგნით. იმედი მაქვს, ეს წიგნი ასეთი მუშაობის დასაწყისი გახდება.
