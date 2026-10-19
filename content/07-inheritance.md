---
n: 07
title: მემკვიდრეობა და პოლიმორფიზმი
en: Inheritance and polymorphism
eyebrow: OOP
topics: ბაზისური და მემკვიდრე კლასი · virtual / override · dynamic_cast · qobject_cast
---

ფენების იერარქია QGIS-ის ხერხემალია: `QgsMapLayer` ზოგადი ფენაა, `QgsVectorLayer` და `QgsRasterLayer` მისი კონკრეტული სახეები. ეს თავი ხსნის, როგორ მუშაობს ასეთი სტრუქტურა.

## მემკვიდრეობა

::: analogy ზოგადი და კონკრეტული
„ტრანსპორტი“ ზოგადი ცნებაა, „ავტობუსი“ და „მატარებელი“ მისი სახეებია. ორივეს აქვს სიჩქარე და მარშრუტი, მაგრამ თითოეულს თავისი თვისებაც აქვს. ფენებიც ასეა: ყველას აქვს სახელი და CRS, ვექტორულს დამატებით ობიექტები, რასტრულს — არხები (band).
:::

```
QgsMapLayer
 ├─ QgsVectorLayer   (ობიექტები, ატრიბუტები)
 └─ QgsRasterLayer   (პიქსელები, არხები)
```

C++-ში მემკვიდრეობა იწერება `: public Base`.

## virtual და override

თუ მეთოდი `virtual`-ია, გამოძახებისას ირჩევა **რეალური** ობიექტის ვერსია და არა მაჩვენებლის ტიპისა. ამას პოლიმორფიზმი ჰქვია.

```cpp layers.cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>

class Layer {
public:
    explicit Layer(std::string name) : mName(std::move(name)) {}
    virtual ~Layer() = default;

    const std::string &name() const { return mName; }
    virtual std::string type() const { return "generic"; }

private:
    std::string mName;
};

class VectorLayer : public Layer {
public:
    VectorLayer(std::string name, int count)
        : Layer(std::move(name)), mCount(count) {}

    std::string type() const override { return "vector"; }
    int featureCount() const { return mCount; }

private:
    int mCount;
};

class RasterLayer : public Layer {
public:
    explicit RasterLayer(std::string name) : Layer(std::move(name)) {}
    std::string type() const override { return "raster"; }
};

int main() {
    VectorLayer rivers("Rivers", 42);
    RasterLayer dem("DEM");

    std::vector<Layer *> layers = {&rivers, &dem};
    for (Layer *layer : layers) {
        std::cout << layer->name() << " is " << layer->type() << "\n";
    }
    return 0;
}
```

```output
Rivers is vector
DEM is raster
```

ორივე ელემენტი `Layer *`-ია, მაგრამ `type()` თითოეულისთვის საკუთარ პასუხს აბრუნებს. სწორედ ამიტომ ინახავს QGIS ყველა ფენას ერთ სიაში, როგორც `QgsMapLayer *`.

::: note
`override` არ არის სავალდებულო, მაგრამ კომპილატორს ამოწმებს: თუ მეთოდის სახელი ან პარამეტრი შეეშალა, შეცდომას დაგიბრუნებს. `virtual ~Layer()` ბაზისურ კლასში აუცილებელია, რომ წაშლისას სწორი დესტრუქტორი გამოიძახოს.
:::

## ტიპის გარდაქმნა: dynamic_cast

სიაში `Layer *` გვაქვს. `featureCount()` კი მხოლოდ `VectorLayer`-ს აქვს. როგორ მივწვდეთ? `dynamic_cast` ამოწმებს რეალურ ტიპს გაშვების დროს.

```cpp
for (Layer *layer : layers) {
    if (auto *vec = dynamic_cast<VectorLayer *>(layer)) {
        std::cout << vec->name() << ": " << vec->featureCount() << " features\n";
    }
}
```

```output
Rivers: 42 features
```

თუ ობიექტი ვექტორული ფენა არ არის, `dynamic_cast` აბრუნებს `nullptr`-ს. ზუსტად ამიტომ ვამოწმებთ `if`-ში.

## qobject_cast QGIS-ში

QGIS-ის კლასები `QObject`-იდან მოდის, ამიტომ იქ `dynamic_cast`-ის უფრო სწრაფი ვერსია გამოიყენება:

::: compare
```python
layer = iface.activeLayer()
if isinstance(layer, QgsVectorLayer):
    print(layer.featureCount())
```

```cpp
auto *vec = qobject_cast<QgsVectorLayer *>(
              iface->activeLayer());
if (vec) {
  qDebug() << vec->featureCount();
}
```
:::

::: warn ყურადღება
`qobject_cast` აბრუნებს `nullptr`-ს, თუ გარდაქმნა შეუძლებელია, ანუ აქტიური ფენა რასტრულია ან საერთოდ არ არის არჩეული. ყოველთვის შეამოწმე შედეგი `nullptr`-ზე.
:::

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. დაამატე `RasterLayer`-ს `bandCount()` და გამოიტანე `dynamic_cast`-ით.
2. შექმენი მესამე სახე `MeshLayer` და `type()` მიანიჭე `"mesh"`.
3. დაწერე ფუნქცია `int totalFeatures(const std::vector<Layer *> &layers)`, რომელიც მხოლოდ ვექტორული ფენების ობიექტებს დაითვლის.
:::

::: summary შეჯამება
- მემკვიდრე კლასი იღებს ბაზისური კლასის ყველაფერს და ამატებს საკუთარს.
- `virtual` + `override` = პოლიმორფიზმი.
- ბაზისური ტიპიდან მემკვიდრეზე: `dynamic_cast` (QGIS-ში `qobject_cast`), შედეგი უნდა შემოწმდეს.
:::
