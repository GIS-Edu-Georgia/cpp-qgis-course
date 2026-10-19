---
n: 11
title: api.qgis.org-ის კითხვა
en: Reading the QGIS C++ API documentation
eyebrow: ორიენტაცია
topics: კლასის გვერდის სტრუქტურა · ხელმოწერების გაშიფვრა · სასარგებლო კლასები · სტრატეგია
---

დოკუმენტაცია (api.qgis.org) თავიდან გაუგებარი ჩანს, რადგან ის პროგრამისტისთვისაა დაწერილი და ხშირად ტერმინებს არ განმარტავს. ახლა უკვე გაქვს ყველა საჭირო ინსტრუმენტი: ტიპები, მაჩვენებლები, მითითებები, კლასები, `QVariant`. ამ თავში სისტემატურად ვისწავლით დოკუმენტაციის „კითხვას“.

ეს გვერდები ავტომატურად გენერირდება კოდის header (`.h`) ფაილებიდან ინსტრუმენტით **Doxygen**, ამიტომ დოკუმენტაცია ზუსტად ის არის, რაც კოდშია. რამდენიმე სასარგებლო ტერმინი: **enum** — დასახელებული მნიშვნელობების ნაკრები (მაგალითად, ფენის ტიპები: ვექტორული, რასტრული); **typedef** — არსებული ტიპის მეორე სახელი; **static** მეთოდი — მეთოდი, რომელსაც ობიექტის გარეშე, პირდაპირ კლასიდან ვუძახებთ.

## კლასის გვერდის სქემა

`api.qgis.org/api/<ვერსია>/class<სახელი>.html` გვერდს ერთი და იგივე სტრუქტურა აქვს:

| ნაწილი | რას ეძებ იქ |
|---|---|
| **Detailed Description** | რისთვისაა კლასი, მაგალითები; ყოველთვის ჯერ ეს წაიკითხე |
| **Inheritance diagram** | ვისგან მოდის (იხ. თავი 07); მემკვიდრეობით მიღებული მეთოდები მშობლის გვერდზეა |
| **Public Types** | enum-ები და typedef-ები; აქ ჩანს, რას ნიშნავს კლასის სახელი |
| **Public Member Functions** | მეთოდები; ძირითადი სამუშაო |
| **Static Public Member Functions** | გამოიძახება კლასზე, ობიექტის გარეშე: `QgsProject::instance()` |
| **Signals / Slots** | რა მოვლენებს აგზავნის |
| **Member Function Documentation** | თითოეული მეთოდის დეტალები, `Since QGIS 3.x` ნიშნები |

::: tip წესი
პირველად გვერდის ბოლოს ნუ იწყებ. წაიკითხე **Detailed Description**, შემდეგ მეთოდების სია, შემდეგ კონკრეტული მეთოდი.
:::

## ხელმოწერის გაშიფვრა

ავიღოთ რამდენიმე რეალური ჩანაწერი და წავიკითხოთ ისინი ისე, როგორც კომპილატორი კითხულობს.

| ჩანაწერი | კლასი | როგორ იკითხება |
|---|---|---|
| `QgsGeometry geometry() const` | `QgsFeature` | ობიექტის გეომეტრია, ასლად; მეთოდი ობიექტს არ ცვლის |
| `void setGeometry(const QgsGeometry &geometry)` | `QgsFeature` | გეომეტრიას ვუთითებ; კოპირება არ ხდება, ორიგინალს არ შეცვლის |
| `QVariant attribute(const QString &name) const` | `QgsFeature` | ველის მნიშვნელობა სახელით; `QVariant`-ად |
| `QgsFeatureId id() const` | `QgsFeature` | ობიექტის უნიკალური ნომერი |
| `bool isValid() const` | `QgsFeature` | ობიექტი ვალიდურია თუ არა |
| `QgsFeatureIterator getFeatures(const QgsFeatureRequest &request = QgsFeatureRequest()) const` | `QgsVectorLayer` | ობიექტების iterator; პარამეტრი არასავალდებულოა (default) |
| `double area() const` | `QgsGeometry` | გეომეტრიის გეგმური ფართობი (კოორდინატების ერთეულის კვადრატი) |
| `static QgsGeometry fromPointXY(const QgsPointXY &point)` | `QgsGeometry` | `static`: გამოიძახება `QgsGeometry::fromPointXY(...)`-ით |
| `QList<QgsMapLayer *> mapLayersByName(const QString &name) const` | `QgsProject` | ფენების სია სახელით; ელემენტები მაჩვენებლებია, შეამოწმე ცარიელია თუ არა |

## მაკროები, რომლებიც შეგხვდება

| ჩანაწერი | აზრი |
|---|---|
| `SIP_SKIP`, `SIP_OUT`, `SIP_FACTORY` | მითითებები Python-ის დამაკავშირებელი გენერატორისთვის (SIP); C++-ში შეგიძლია უგულებელყო |
| `Q_INVOKABLE` | მეთოდი Qt-ის მეტა-სისტემიდან გამოიძახება |
| `Q_DECL_DEPRECATED` | მოძველებულია, ნუ გამოიყენებ |
| `CORE_EXPORT` | კლასი ბიბლიოთეკიდან გამოდის; ტექნიკური დეტალია |
| `Since QGIS 3.xx` | მეთოდი ამ ვერსიიდან არსებობს |

## ცოცხალი მაგალითი: ამოცანიდან მეთოდამდე

ამოცანა: ფენაში თითოეული ობიექტის ფართობი გამოვთვალოთ.

1. იპოვე ფენის კლასი: `QgsVectorLayer`.
2. იქ ნახე `getFeatures()` → აბრუნებს `QgsFeatureIterator`-ს.
3. იტერატორიდან მიიღებ `QgsFeature`-ს.
4. `QgsFeature::geometry()` → `QgsGeometry`.
5. `QgsGeometry::area()` → `double`.

```cpp
QgsFeatureIterator it = layer->getFeatures();
QgsFeature feature;
while (it.nextFeature(feature)) {
    double area = feature.geometry().area();
    qDebug() << feature.id() << area;
}
```

ხაზ-ხაზ: `getFeatures()` იძლევა იტერატორს (ობიექტებს სათითაოდ გვაწვდის); `QgsFeature feature;` ცარიელი ობიექტია, რომელშიც ყოველ ნაბიჯზე ახალი მოხვდება; `while (it.nextFeature(feature))` იმეორებს ციკლს, სანამ ობიექტები არსებობს; ციკლის შიგნით `feature.geometry().area()` ჯერ გეომეტრიას იღებს, შემდეგ მის ფართობს; `qDebug()` კი შედეგს ბეჭდავს.

თუ Python-ს იცნობ, შედარება:

::: compare
```python
for f in layer.getFeatures():
    print(f.id(), f.geometry().area())
```

```cpp
QgsFeature f;
QgsFeatureIterator it = layer->getFeatures();
while (it.nextFeature(f)) {
  qDebug() << f.id() << f.geometry().area();
}
```
:::

::: warn ფართობი და CRS
`QgsGeometry::area()` დოკუმენტაციის მიხედვით გეგმური (planar) ფართობია, გამოთვლილი კოორდინატების ერთეულებში. გეოგრაფიულ CRS-ში (გრადუსები) ის კვადრატული გრადუსია და კვადრატულ მეტრებად არ ითვლება. გეოდეზიური (ელიფსოიდური) გამოთვლისთვის დოკუმენტაცია `QgsDistanceArea`-ს გვირჩევს (იხ. თავი 12). ასეთი ნიუანსები ხშირად დოკუმენტაციის აღწერაშია, ამიტომ ხელმოწერასთან ერთად აღწერაც წაიკითხე.
:::

## ვერსიები

ამ თავის ხელმოწერები გადამოწმებულია `api.qgis.org`-ის **4.3.0-Master** დოკუმენტაციასთან. თუ შენი QGIS სხვა ვერსიისაა (მაგ. 3.x), გვერდის ზედა ნაწილში ვერსიის არჩევით გადაამოწმე იგივე კლასი: ზოგ მეთოდს განსხვავებული overload შეიძლება ჰქონდეს. მაგალითად, `QgsGeometry::buffer` ახალ დოკუმენტაციაში ორი სახითაა: `buffer(double distance, int segments, QgsFeedback *feedback = nullptr) const` და გაფართოებული ვერსია სტილის პარამეტრებით.

## ბილიკი დოკუმენტაციიდან კოდამდე

ვთქვათ, გვინდა ფენის ობიექტების რაოდენობა. ეტაპები:

1. გახსენი `QgsVectorLayer`-ის გვერდი და მოძებნე „count“. იპოვე `long long featureCount() const`;
2. გვერდის ზედა ნაწილში წერია header: `#include <qgsvectorlayer.h>`;
3. ეს კლასი `qgis_core` ბიბლიოთეკაშია (იხ. თავი 01, არქიტექტურის ცხრილი), ამიტომ CMake-ში `qgis_core` უნდა მივაბათ;
4. გამოიყენე: `long long n = layer->featureCount();` (მაჩვენებელზე `->`, ობიექტზე `.`).

ანუ ყოველ ახალ მეთოდზე სამი რამ გვჭირდება: **ხელმოწერა**, **`#include`** და **ბიბლიოთეკა**, რომელშიც ის დევს.

## ძირითადი კლასები ერთ ცხრილში

| კლასი | რას აკეთებს | PyQGIS-ის ანალოგი |
|---|---|---|
| `QgsProject` | პროექტი, ფენების მფლობელი | `QgsProject.instance()` |
| `QgsVectorLayer` | ვექტორული ფენა | იგივე |
| `QgsRasterLayer` | რასტრული ფენა | იგივე |
| `QgsFeature` | ობიექტი: ID, გეომეტრია, ატრიბუტები | იგივე |
| `QgsGeometry` | გეომეტრია და ოპერაციები | იგივე |
| `QgsPointXY` | 2D წერტილი | იგივე |
| `QgsCoordinateReferenceSystem` | CRS | იგივე |
| `QgsCoordinateTransform` | გადაყვანა CRS-ებს შორის | იგივე |
| `QgsFeatureRequest` | ფილტრი ობიექტების არჩევისას | იგივე |

## შეცდომის კითხვა

კომპილატორის შეცდომა პირველად საშიშად გამოიყურება, მაგრამ ხშირად ერთი ხაზი გვეუბნება მთავარს:

| შეცდომა | ჩვეულებრივი მიზეზი |
|---|---|
| `'QgsFeature' was not declared` | ჩასართავი `#include <qgsfeature.h>` გაგრჩა |
| `undefined reference to ...` | ბიბლიოთეკა არ არის მიბმული (`target_link_libraries`) |
| `passing 'const X' as 'this' discards qualifiers` | `const` ობიექტზე არა-`const` მეთოდი გამოიძახე |
| `cannot convert 'QString' to 'std::string'` | გამოიყენე `.toStdString()` |

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. გახსენი `QgsAttributes` გვერდი. იპოვე მშობელი კლასი და ჩამოწერე სამი მეთოდი.
2. იპოვე `QgsGeometry::buffer` ხელმოწერა. რა პარამეტრები აქვს? რას აბრუნებს? რომელი პარამეტრია `const`?
3. იპოვე, რა მეთოდი უნდა გამოიყენო ფენაში არჩეული ობიექტების დასათვლელად (`QgsVectorLayer`-ის გვერდზე ეძებე „selected“).
4. გადააკეთე წინა მაგალითი ისე, რომ მხოლოდ ისეთი ობიექტები დაითვალოს, რომელთა ფართობი 1000-ზე მეტია.
:::

::: summary შეჯამება
- ჯერ **Detailed Description**, მერე მეთოდების სია.
- ხელმოწერა იკითხება მარცხნიდან: დაბრუნების ტიპი, სახელი, პარამეტრები (`*`/`&`/`const`), მეთოდის `const`.
- PyQGIS-ის ცოდნა = დოკუმენტაციის ცოდნა: სახელები ერთია.
:::
