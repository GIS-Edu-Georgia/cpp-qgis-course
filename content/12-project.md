---
n: 12
title: პროექტი: საკუთარი ინსტრუმენტი QGIS-ში
en: Capstone — your own tool inside QGIS
eyebrow: პრაქტიკა
topics: QGIS-ის აწყობა წყაროდან · დამოუკიდებელი C++ აპლიკაცია · C++ პლაგინის ჩონჩხი · CMake · ლიცენზია
---

საბოლოო მიზანი: საკუთარი C++ კოდი QGIS-თან ერთად გაუშვა. გზა სამ საფეხურად ვაგებთ: ჯერ ვმუშაობთ QGIS-ის ბიბლიოთეკასთან დამოუკიდებელ აპლიკაციაში, შემდეგ ვაკეთებთ პლაგინს, ბოლოს ვაწყობთ QGIS-ს წყაროდან.

## გეგმა

| საფეხური | შედეგი | სირთულე |
|---|---|---|
| 1 | კონსოლური პროგრამა, რომელიც `qgis_core`-ს იყენებს | დაბალი |
| 2 | C++ პლაგინი, რომელიც QGIS-ის მენიუში ჩნდება | საშუალო |
| 3 | QGIS-ის აწყობა წყარო კოდიდან (შენი კოდით ან მის გარეშე) | მაღალი |

::: tip რჩევა
ბევრი ადამიანი პირდაპირ მესამე საფეხურზე ხტება და იჭედება აწყობის დეტალებში. პირველი ორი უკვე გასაგებ შედეგს იძლევა და გასწავლის ბიბლიოთეკების ერთად მუშაობას.
:::

## საფეხური 1: პირველი პროგრამა `qgis_core`-ზე

ამოცანა: ფენის ობიექტების დათვლა და ფართობების ჯამი.

```cpp main.cpp
#include <iostream>

#include <qgsapplication.h>
#include <qgsfeature.h>
#include <qgsgeometry.h>
#include <qgsvectorlayer.h>

int main(int argc, char *argv[]) {
    QgsApplication app(argc, argv, false);     // false = GUI არ გვჭირდება
    QgsApplication::initQgis();

    QgsVectorLayer layer("rivers.geojson", "rivers", "ogr");
    if (!layer.isValid()) {
        std::cerr << "Layer failed to load\n";
        return 1;
    }

    std::cout << "Features: " << layer.featureCount() << "\n";

    double totalArea = 0.0;
    QgsFeature feature;
    QgsFeatureIterator it = layer.getFeatures();
    while (it.nextFeature(feature)) {
        totalArea += feature.geometry().area();
    }
    std::cout << "Total area: " << totalArea << "\n";

    QgsApplication::exitQgis();
    return 0;
}
```

```output
Features: 42
Total area: 0.183762
```

რიცხვები საილუსტრაციოა: ისინი შენი მონაცემის მიხედვით განსხვავდება. ყურადღება მიაქციე `layer.isValid()` შემოწმებას: ფენის ჩატვირთვა შეიძლება ჩაიშალოს.

## CMake

`CMakeLists.txt` უთხრის კომპილატორს, სად არის QGIS-ის header-ები და ბიბლიოთეკები.

```cmake CMakeLists.txt
cmake_minimum_required(VERSION 3.16)
project(feature_counter LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)

# QGIS 4 = Qt6, QGIS 3 = Qt5. აირჩიე შენი QGIS-ის შესაბამისი.
find_package(Qt6 REQUIRED COMPONENTS Core Gui Xml Widgets)

find_path(QGIS_INCLUDE_DIR qgsapplication.h PATH_SUFFIXES qgis)
find_library(QGIS_CORE_LIBRARY qgis_core)

add_executable(feature_counter main.cpp)
target_include_directories(feature_counter PRIVATE ${QGIS_INCLUDE_DIR})
target_link_libraries(feature_counter PRIVATE
    ${QGIS_CORE_LIBRARY} Qt6::Core Qt6::Gui Qt6::Xml Qt6::Widgets)
```

```bash
cmake -S . -B build
cmake --build build
./build/feature_counter
```

::: warn გაითვალისწინე
`qgis_core` და Qt-ის ვერსიები უნდა ემთხვეოდეს იმას, რითაც თავად QGIS არის აწყობილი. პაკეტები (`qgis-dev` Linux-ზე, OSGeo4W Windows-ზე) ამ ჯგუფს ერთად გაძლევს. ზუსტი სახელები და ბილიკები სისტემაზეა დამოკიდებული.
:::

## საფეხური 2: C++ პლაგინის ჩონჩხი

C++ პლაგინი არის დინამიური ბიბლიოთეკა, რომელსაც QGIS გაშვებისას ტვირთავს. მას აქვს `QgisPlugin` ინტერფეისი და ექსპორტირებული ფუნქციები.

```cpp mytool.h
#pragma once
#include <QAction>
#include <QObject>
#include <qgisplugin.h>

class QgisInterface;

class MyTool : public QObject, public QgisPlugin {
    Q_OBJECT
public:
    explicit MyTool(QgisInterface *iface);

    void initGui() override;      // QGIS გვიძახებს ჩატვირთვისას
    void unload() override;       // და გამორთვისას

private slots:
    void run();

private:
    QgisInterface *mIface = nullptr;
    QAction *mAction = nullptr;
};
```

```cpp mytool.cpp
#include "mytool.h"

#include <QMessageBox>
#include <qgisinterface.h>
#include <qgsvectorlayer.h>

MyTool::MyTool(QgisInterface *iface)
    : QgisPlugin(QStringLiteral("Feature Counter"),
                 QStringLiteral("Counts features of the active layer"),
                 QStringLiteral("Analysis"), QStringLiteral("0.1"),
                 QgisPlugin::UI),
      mIface(iface) {}

void MyTool::initGui() {
    mAction = new QAction(tr("Count features"), this);
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
```

გამოიყენე ყველაფერი, რაც ისწავლე: `qobject_cast` + `nullptr` შემოწმება (თავები 04, 07), `connect` (თავი 10), `const` და `QString` (თავები 05, 10).

::: warn ჩონჩხი და რეალური კოდი
ზემოთ მოცემული კოდი არის სტრუქტურის ილუსტრაცია. პლაგინის ექსპორტირებული ფუნქციები (`classFactory`, `name`, `version` და სხვა) და `QgisPlugin`-ის კონსტრუქტორის ზუსტი ხელმოწერა ვერსიიდან ვერსიამდე შეიძლება შეიცვალოს. შენი QGIS-ის ვერსიის წყარო კოდში `src/plugins/` საქაღალდეშია მოქმედი მაგალითები. დაიწყე მათი კოპირებით და მერე შეცვალე.
:::

## საფეხური 3: QGIS-ის აწყობა წყაროდან

```bash
git clone https://github.com/qgis/QGIS.git
cd QGIS
mkdir build && cd build
cmake -G Ninja -DCMAKE_BUILD_TYPE=Debug ..
ninja
```

| ეტაპი | რა ხდება |
|---|---|
| `cmake` | ამოწმებს დამოკიდებულებებს (Qt, GDAL, GEOS, PROJ...) და ქმნის build ფაილებს |
| `ninja` | აკომპილებს; პირველად დიდ დროს მოითხოვს |
| ტესტი | გაუშვი აწყობილი `qgis`; შემდეგ დაამატე შენი პლაგინი `src/plugins/` ქვეშ |

მცირე ცვლილების შეტანის შემდეგ `ninja` მხოლოდ შეცვლილ ფაილებს აკომპილებს.

::: warn ლიცენზია
QGIS ვრცელდება GNU GPL ლიცენზიით. თუ შენ მიერ შეცვლილ QGIS-ს ან მასში ჩაშენებულ კოდს სხვას გადასცემ, მიმღებს უფლება აქვს მოითხოვოს **წყარო კოდიც**. ამიტომ „დახურული ბინარული“ მხოლოდ საკუთარი გამოყენებისთვის მუშაობს. ბინარულ ფაილშიც კოდის აღდგენა სრულიად შეუძლებელი არ არის. საკუთარი ალგორითმის დასაცავად გააზრებულად აირჩიე არქიტექტურა და გადაამოწმე ლიცენზიის პირობები გავრცელებამდე.
:::

## სავარჯიშო და შეჯამება

::: exercise საბოლოო დავალება
1. გააკეთე საფეხური 1 შენი მონაცემით (მაგ. რაიონების პოლიგონები) და გამოიტანე თითოეული რაიონის ფართობი.
2. დაამატე `QgsFeatureRequest` ფილტრი და დათვალე მხოლოდ ობიექტები გარკვეული ატრიბუტით.
3. წაიკითხე `src/plugins/`-ში არსებული ერთი მარტივი პლაგინი და შეადარე შენს ჩონჩხს.
4. მოამზადე 5-ხაზიანი დოკუმენტი: რა ისწავლე, რა გაუგებარია, რა გინდა შემდეგ ეტაპზე.
:::

::: summary კურსის შეჯამება
- PyQGIS და C++ API ერთი სისტემაა; სახელები იგივეა, გრამატიკა — განსხვავებული.
- `*` — შეიძლება `nullptr`, `&` — აუცილებლად არსებობს, `const &` — უსაფრთხო წაკითხვა.
- smart pointer-ები და QObject-ის ხე მეხსიერებას თავად მართავენ.
- `api.qgis.org` იკითხება: აღწერა, ტიპები, ხელმოწერა.
- გზა: დამოუკიდებელი აპლიკაცია → პლაგინი → QGIS-ის აწყობა.
:::
