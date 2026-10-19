---
n: 05
title: მითითებები (References) და const
en: References and const
eyebrow: მეხსიერება
topics: & როგორც მეტსახელი · გადაცემა მნიშვნელობით და მითითებით · const & · QGIS ხელმოწერების კითხვა
---

წინა თავში მაჩვენებელი გავიგეთ. QGIS-ის API-ში მასთან ერთად ყველგან გვხვდება `&`: `const QgsFeature &feature`. ამ თავის შემდეგ ამ ჩანაწერს დაუფიქრებლად წაიკითხავ.

## მეტსახელი

მითითება (reference) არის ცვლადის **მეტსახელი**: ერთი ობიექტი, ორი სახელი.

```cpp alias.cpp
#include <iostream>

int main() {
    int featureCount = 100;
    int &ref = featureCount;     // ref არის featureCount-ის მეტსახელი

    ref = 300;
    std::cout << featureCount << "\n";
    return 0;
}
```

```output
300
```

::: analogy ბანკის პერსონალური ასისტენტი
სოლო მომსახურების ასისტენტი ერთხელ და სამუდამოდ გიმაგრდება. ის არ იცვლება ყოველ ვიზიტზე და ცარიელი არ არის. მითითება ზუსტად ასეა: იბადება კონკრეტულ ობიექტზე მიბმული, ვეღარ გადაიბმება სხვაზე და `nullptr` ვერ იქნება.
:::

## მაჩვენებელი თუ მითითება?

| | მაჩვენებელი `*` | მითითება `&` |
|---|---|---|
| შეიძლება ცარიელი იყოს | დიახ, `nullptr` | არა |
| შეიძლება სხვაზე გადაიბას | დიახ | არა |
| წევრთან მისვლა | `p->name` | `r.name` |
| როდის | ობიექტი შეიძლება არ არსებობდეს | ობიექტი აუცილებლად არსებობს |

::: tip მოკლედ
მაჩვენებელი — როცა ობიექტი შეიძლება არ არსებობდეს ან შეიცვალოს. მითითება — როცა ობიექტი უეჭველად არსებობს.
:::

## ფუნქციაში გადაცემა: კოპირება თუ ორიგინალი

```cpp byref.cpp
#include <iostream>
#include <string>

struct Layer {
    std::string name;
    int featureCount;
};

void addByValue(Layer layer, int n) {
    layer.featureCount += n;          // ცვლის ასლს
}

void addByRef(Layer &layer, int n) {
    layer.featureCount += n;          // ცვლის ორიგინალს
}

int main() {
    Layer roads{"Roads", 100};

    addByValue(roads, 25);
    std::cout << "After value: " << roads.featureCount << "\n";

    addByRef(roads, 25);
    std::cout << "After ref: " << roads.featureCount << "\n";
    return 0;
}
```

```output
After value: 100
After ref: 125
```

პირველ შემთხვევაში ფუნქციამ ობიექტის **ასლი** მიიღო და ორიგინალი არ შეცვლილა. მეორეში `&`-ის გამო იმუშავა თავად ორიგინალზე.

## const & — უსაფრთხო დათვალიერება

თუ ფუნქციას მხოლოდ წასაკითხად სჭირდება ობიექტი, ვწერთ `const T &`. კოპირება არ ხდება და ფუნქციას ცვლილების უფლებაც არ აქვს.

```cpp perimeter.cpp
#include <iostream>
#include <vector>
#include <cmath>

struct Point {
    double x;
    double y;
};

double perimeter(const std::vector<Point> &ring) {
    double total = 0.0;
    for (size_t i = 0; i < ring.size(); ++i) {
        const Point &a = ring[i];
        const Point &b = ring[(i + 1) % ring.size()];
        total += std::hypot(b.x - a.x, b.y - a.y);
    }
    return total;
}

int main() {
    std::vector<Point> parcel = {{0, 0}, {10, 0}, {10, 10}, {0, 10}};
    std::cout << "Perimeter: " << perimeter(parcel) << "\n";
    return 0;
}
```

```output
Perimeter: 40
```

::: note
`(i + 1) % ring.size()` ბოლო წერტილიდან პირველს უკავშირებს ანუ კონტურს ხურავს. თუ გადაიცემოდა `std::vector<Point> ring` (&-ის გარეშე), ყოველ გამოძახებაზე მთელი წერტილების სია დაკოპირდებოდა.
:::

::: warn
`const`-ის დარღვევა კომპილაციის შეცდომაა. `ring[0].x = 5;` ამ ფუნქციაში კომპილაციას ვერ გაივლის.
:::

## QGIS-ის ხელმოწერების კითხვა

ახლა `api.qgis.org`-ის გვერდებიდან ეს ჩანაწერები ადვილად იკითხება:

| ჩანაწერი | როგორ წავიკითხო |
|---|---|
| `QgsVectorLayer *layer` | ფენის მისამართი; შეიძლება `nullptr` იყოს, შეამოწმე |
| `const QgsFeature &feature` | ობიექტი აუცილებლად არსებობს, ვკითხულობ და არ ვცვლი, არ ვაკოპირებ |
| `QgsGeometry &geometry` | ობიექტი არსებობს და ფუნქციას უფლება აქვს, ის შეცვალოს |
| `const QString &name` | ტექსტი კოპირების გარეშე, მხოლოდ საკითხავად |
| `QgsFeature feature` | მიიღება ასლი |

::: compare
```python
def count_features(layer):
    return layer.featureCount()
```

```cpp
qint64 countFeatures(const QgsVectorLayer *layer) {
  return layer->featureCount();
}
```
:::

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. დაწერე `void expand(Parcel &p, double extra)`, რომელიც ნაკვეთის ფართობს გაზრდის. შეამოწმე `main`-ში.
2. დაწერე `void printParcel(const Parcel &p)`. შეეცადე მასში ფართობის შეცვლას და ნახე კომპილატორის შეცდომა.
3. დაწერე `double area(const std::vector<Point> &ring)` (შუსტერის ფორმულა: `0.5 * |Σ (xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ)|`). კვადრატული ნაკვეთისთვის (0,0), (10,0), (10,10), (0,10) უნდა მიიღო 100.
:::

::: summary შეჯამება
- `T &` — მეტსახელი, ობიექტი აუცილებლად არსებობს.
- ფუნქციაში ობიექტს ორიგინალად გადავცემთ `&`-ით, წასაკითხად — `const &`-ით.
- `T *` — მაჩვენებელი, `nullptr`-ს შემოწმებით.
- ახლა `const QgsFeature &feature` სრულად გესმის.
:::
