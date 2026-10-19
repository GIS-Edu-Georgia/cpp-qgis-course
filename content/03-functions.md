---
n: 03
title: ფუნქციები და namespace
en: Functions and namespaces
eyebrow: საფუძვლები
topics: ფუნქციის ხელმოწერა · overload · default არგუმენტი · .h/.cpp დაყოფა · namespace და ::
---

QGIS-ის კოდში ყველაფერი კლასებშია, მაგრამ კლასის მეთოდიც ფუნქციაა. ფუნქციის ხელმოწერის კითხვა დოკუმენტაციის გასაგებად პირველი აუცილებელი უნარია.

## ფუნქციის ანატომია

```cpp
double calculateArea(double width, double height) {
    return width * height;
}
```

| ნაწილი | მაგალითში | მნიშვნელობა |
|---|---|---|
| დაბრუნების ტიპი | `double` | რას დაგიბრუნებს |
| სახელი | `calculateArea` | როგორ გამოვიძახოთ |
| პარამეტრები | `double width, double height` | რა უნდა გადავცეთ (თითოეულს ტიპი აქვს) |
| სხეული | `{ ... }` | რას აკეთებს |

თუ ფუნქცია არაფერს აბრუნებს, დაბრუნების ტიპია `void`.

::: warn გავრცელებული შეცდომა
ფუნქციის განსაზღვრისას ფრჩხილების შემდეგ `;` არ დაიდება: `double f(double a); { ... }` არასწორია, რადგან `;` აქ ფუნქციას „დეკლარაციად“ აქცევს და ფიგურული ფრჩხილები ფუნქციას აღარ ეკუთვნის.
:::

## namespace — სახელების საქაღალდე

::: analogy საქაღალდეები კომპიუტერში
ორ საქაღალდეში (`ProjectA`, `ProjectB`) შეიძლება ერთი სახელის ფაილი გვქონდეს, `data.txt`. კონფლიქტი არ იქნება, რადგან მისამართი განსხვავებულია. `namespace` სწორედ ასეთი საქაღალდეა კოდისთვის.
:::

```cpp area.cpp
#include <iostream>

namespace GIS {
    double calculateArea(double width, double height) {
        return width * height;
    }
}

int main() {
    double area = GIS::calculateArea(5.0, 10.0);
    std::cout << "Area: " << area << std::endl;
    return 0;
}
```

```output
Area: 50
```

`::` არის scope resolution operator: „შედი `GIS`-ში და იქიდან აიღე `calculateArea`“. ანალოგიურად `std::cout` ნიშნავს „სტანდარტული ბიბლიოთეკის `cout`“.

::: tip QGIS-ში
`Qgis::WkbType`, `Qgis::DistanceUnit` — ეს `Qgis` სახელების სივრცეა. კლასებს კი `Qgs` პრეფიქსი აქვთ: `QgsFeature`, `QgsProject`. პრეფიქსიც ერთგვარი namespace-ია ძველი სტილით.
:::

## overload — ერთი სახელი, სხვადასხვა პარამეტრები

C++-ში ერთსა და იმავე სახელზე რამდენიმე ფუნქცია შეიძლება არსებობდეს, თუ პარამეტრები განსხვავდება.

```cpp overload.cpp
#include <iostream>

namespace GIS {
    double calculateArea(double width, double height) {
        return width * height;                 // მართკუთხედი
    }
    double calculateArea(double radius) {
        return 3.14159 * radius * radius;      // წრე
    }
}

int main() {
    std::cout << GIS::calculateArea(5.0, 10.0) << "\n";
    std::cout << GIS::calculateArea(10.0) << "\n";
    return 0;
}
```

```output
50
314.159
```

QGIS-ის API სავსეა ასეთი overload-ებით: მაგალითად, `QgsPointXY` რამდენიმე კონსტრუქტორით იქმნება.

## default პარამეტრი

```cpp units.cpp
#include <iostream>

double toMeters(double value, double factor = 1.0) {
    return value * factor;
}

int main() {
    std::cout << toMeters(2.5, 1000.0) << "\n";   // კილომეტრი -> მეტრი
    std::cout << toMeters(7.0) << "\n";            // უკვე მეტრებშია
    return 0;
}
```

```output
2500
7
```

default მნიშვნელობა მხოლოდ ბოლო პარამეტრებს შეიძლება ჰქონდეთ.

## მანძილი ორ წერტილს შორის

```cpp distance.cpp
#include <iostream>
#include <cmath>

namespace GIS {
    double distance(double x1, double y1, double x2, double y2) {
        return std::hypot(x2 - x1, y2 - y1);
    }
}

int main() {
    std::cout << GIS::distance(0.0, 0.0, 3.0, 4.0) << "\n";
    return 0;
}
```

```output
5
```

`std::hypot(a, b)` არის `sqrt(a*a + b*b)`, ანუ პითაგორას თეორემა: მანძილი დეკარტულ (გეგმურ) კოორდინატებში.

## .h და .cpp ფაილები

დიდ პროექტში ფუნქციის **დეკლარაცია** (რას აკეთებს) და **განსაზღვრება** (როგორ აკეთებს) ცალკე ფაილებშია. QGIS-ის მთელი წყარო კოდი ასეა აგებული, `api.qgis.org` კი სწორედ `.h` ფაილებიდან გენერირდება.

```cpp gis_utils.h
#pragma once

namespace GIS {
    double distance(double x1, double y1, double x2, double y2);
}
```

```cpp gis_utils.cpp
#include "gis_utils.h"
#include <cmath>

double GIS::distance(double x1, double y1, double x2, double y2) {
    return std::hypot(x2 - x1, y2 - y1);
}
```

```cpp main.cpp
#include <iostream>
#include "gis_utils.h"

int main() {
    std::cout << GIS::distance(0.0, 0.0, 3.0, 4.0) << "\n";
}
```

```bash
g++ main.cpp gis_utils.cpp -o gis
```

::: note
`#include <...>` — სისტემური ბიბლიოთეკა, `#include "..."` — შენი საკუთარი ფაილი. `#pragma once` იცავს ფაილს ორჯერ ჩართვისგან.
:::

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. დაწერე `GIS::perimeter(double width, double height)` (მართკუთხა ნაკვეთის პერიმეტრი) და შეამოწმე 5 × 10 ზომაზე.
2. დაამატე overload კვადრატისთვის: `perimeter(double side)`.
3. გამოთვალე მანძილი წერტილებს შორის (2, 3) და (6, 6).
4. გადაიტანე ფუნქციები `gis_utils.h` / `gis_utils.cpp` ფაილებში.
:::

::: summary შეჯამება
- ფუნქცია = დაბრუნების ტიპი + სახელი + ტიპიზებული პარამეტრები.
- `namespace` იცავს სახელებს კონფლიქტისგან, `::` მასში შედის.
- overload და default პარამეტრები QGIS API-ში ყველგანაა.
- `.h` — დეკლარაცია, `.cpp` — განსაზღვრება.
:::
