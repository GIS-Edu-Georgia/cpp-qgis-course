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
